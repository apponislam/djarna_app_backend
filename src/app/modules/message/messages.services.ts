import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ConversationModel, MessageModel } from "./messages.model";
import { Message, MessageType } from "./messages.interface";
import { emitToUser } from "../../socket/socket";

/**
 * Create a new conversation
 */
const createConversation = async (senderId: string, payload: { receiverId: string; productId?: string; productOwner?: string }) => {
    const { receiverId, productId, productOwner } = payload;

    let conversation = await ConversationModel.findOne({
        participantIds: { $all: [senderId, receiverId], $size: 2 },
    });

    if (!conversation) {
        conversation = await ConversationModel.create({
            participantIds: [senderId, receiverId],
            productId,
            productOwner,
            unreadCounts: [
                { userId: new Types.ObjectId(senderId), count: 0 },
                { userId: new Types.ObjectId(receiverId), count: 0 },
            ],
        });
    }

    return await ConversationModel.findById(conversation._id).populate([
        { path: "participantIds", select: "_id name photo phone" },
        { path: "productId", select: "_id title images price" },
    ]);
};

/**
 * Send a new message
 */
const sendMessage = async (senderId: string, payload: Partial<Message> & { receiverId: string }) => {
    const { receiverId, ...messageData } = payload;

    // 1. Find or Create conversation
    let conversation = await ConversationModel.findOne({
        participantIds: { $all: [senderId, receiverId], $size: 2 },
    });

    if (!conversation) {
        conversation = await ConversationModel.create({
            participantIds: [senderId, receiverId],
            productId: messageData.productId,
            productOwner: messageData.productOwner,
            unreadCounts: [
                { userId: new Types.ObjectId(senderId), count: 0 },
                { userId: new Types.ObjectId(receiverId), count: 0 },
            ],
        });
    }

    // 2. Create the message
    const newMessage = await MessageModel.create({
        ...messageData,
        conversationId: conversation._id,
        senderId,
    });

    // 3. Update conversation state
    const updatedConversation = await ConversationModel.findByIdAndUpdate(
        conversation._id,
        {
            $set: { lastMessage: newMessage._id },
            $inc: { "unreadCounts.$[elem].count": 1 },
            $pull: { deletedBy: { $in: [senderId, receiverId] } },
        },
        {
            arrayFilters: [{ "elem.userId": receiverId }],
            returnDocument: "after",
        },
    ).populate([{ path: "participantIds", select: "_id name photo phone" }, { path: "productId", select: "_id title images price" }, { path: "lastMessage" }]);

    // 4. Emit events
    const messageToEmit = await MessageModel.findById(newMessage._id).populate("senderId", "_id name photo").lean();

    [senderId, receiverId].forEach((id) => {
        emitToUser(id.toString(), "new_message", messageToEmit);
        emitToUser(id.toString(), "update_conversation", updatedConversation);
    });

    return newMessage;
};

/**
 * Get all conversations for a user
 */
const getMyConversations = async (userId: string) => {
    return await ConversationModel.find({
        participantIds: userId,
        deletedBy: { $ne: new Types.ObjectId(userId) },
    })
        .populate([
            { path: "participantIds", select: "_id name photo phone" },
            { path: "productId", select: "_id title images price" },
            {
                path: "lastMessage",
                populate: { path: "senderId", select: "_id name photo" },
            },
        ])
        .sort({ updatedAt: -1 })
        .lean();
};

/**
 * Get a specific conversation by ID
 */
const getConversationById = async (userId: string, conversationId: string) => {
    const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participantIds: userId,
    }).populate([
        { path: "participantIds", select: "_id name photo phone" },
        { path: "productId", select: "_id title images price" },
        {
            path: "lastMessage",
            populate: { path: "senderId", select: "_id name photo" },
        },
    ]);

    if (!conversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    return conversation;
};

/**
 * Get messages for a specific conversation
 */
const getMessages = async (userId: string, conversationId: string) => {
    const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participantIds: userId,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found or access denied");
    }

    // Mark as read
    await markAsRead(userId, conversationId);

    return await MessageModel.find({
        conversationId,
        deletedBy: { $ne: new Types.ObjectId(userId) },
        isDeleted: false,
    })
        .populate("senderId", "_id name photo")
        .sort({ createdAt: 1 })
        .lean();
};

/**
 * Mark a conversation as read
 */
const markAsRead = async (userId: string, conversationId: string) => {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) return;

    await ConversationModel.markMessageAsRead(conversationId, userId);

    const otherParticipantId = conversation.participantIds.find((id) => id.toString() !== userId.toString());
    if (otherParticipantId) {
        emitToUser(otherParticipantId.toString(), "messages_read", {
            conversationId,
            readBy: userId,
        });
    }

    return { success: true };
};

/**
 * Update offer status
 */
const updateOfferStatus = async (userId: string, messageId: string, status: MessageType) => {
    const message = await MessageModel.findById(messageId);
    if (!message || message.type !== "OFFER") {
        throw new ApiError(httpStatus.NOT_FOUND, "Offer message not found");
    }

    // Update original offer message or create status update message?
    // Based on demo routes, we create a new message with status type
    const conversation = await ConversationModel.findById(message.conversationId);
    if (!conversation) throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");

    const receiverId = conversation.participantIds.find((id) => id.toString() !== userId.toString())?.toString();

    if (!receiverId) throw new ApiError(httpStatus.BAD_REQUEST, "Receiver not found");

    return await sendMessage(userId, {
        conversationId: message.conversationId,
        receiverId,
        type: status,
        productId: message.productId,
        text: `Offer ${status.toLowerCase()}`,
    });
};

/**
 * Edit a specific message
 */
const editMessage = async (userId: string, messageId: string, text: string) => {
    const message = await MessageModel.findOneAndUpdate({ _id: messageId, senderId: userId }, { $set: { text, isEdited: true, editedAt: new Date() } }, { new: true }).populate("senderId", "_id name photo");

    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found or unauthorized");
    }

    // Sync via socket
    const conversation = await ConversationModel.findById(message.conversationId);
    if (conversation) {
        conversation.participantIds.forEach((id) => {
            emitToUser(id.toString(), "message_edited", message);
        });
    }

    return message;
};

/**
 * Delete a conversation for the current user (Cascading Soft Delete)
 */
const deleteConversation = async (userId: string, conversationId: string) => {
    // 1. Mark conversation as deleted for this user
    const conversationResult = await ConversationModel.updateOne({ _id: conversationId, participantIds: userId }, { $addToSet: { deletedBy: userId } });

    if (conversationResult.matchedCount === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    // 2. Mark all messages in this conversation as deleted for this user
    await MessageModel.updateMany({ conversationId, $or: [{ senderId: userId }, { conversationId: { $exists: true } }] }, { $addToSet: { deletedBy: userId } });

    // 3. Emit sync event
    emitToUser(userId, "conversation_deleted", { conversationId });

    return { success: true };
};

/**
 * Delete a specific message (for the user)
 */
const deleteMessage = async (userId: string, messageId: string) => {
    const result = await MessageModel.updateOne({ _id: messageId, $or: [{ senderId: userId }, { conversationId: { $exists: true } }] }, { $addToSet: { deletedBy: userId } });

    if (result.matchedCount === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    emitToUser(userId, "message_deleted", { messageId });

    return { success: true };
};

export const messageServices = {
    createConversation,
    sendMessage,
    getMyConversations,
    getConversationById,
    getMessages,
    markAsRead,
    updateOfferStatus,
    editMessage,
    deleteMessage,
    deleteConversation,
};
