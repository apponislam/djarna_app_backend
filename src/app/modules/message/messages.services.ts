import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ConversationModel, MessageModel } from "./messages.model";
import { Message } from "./messages.interface";
import { emitToUser } from "../../socket/socket";

/**
 * Send a new message or start a conversation
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

    // 3. Update conversation state and fetch necessary data for emission in ONE go
    const updatedConversation = await ConversationModel.findByIdAndUpdate(
        conversation._id,
        {
            $set: { lastMessage: newMessage._id },
            $inc: { "unreadCounts.$[elem].count": 1 },
            $pull: { deletedBy: { $in: [senderId, receiverId] } },
        },
        {
            arrayFilters: [{ "elem.userId": receiverId }],
            new: true,
        },
    ).populate([{ path: "participantIds", select: "name avatar photo phone" }, { path: "productId", select: "title images price" }, { path: "lastMessage" }]);

    // 4. Emit events via optimized socket helper
    if (updatedConversation) {
        // Fetch the message with sender info for UI
        const populatedMessage = await MessageModel.findById(newMessage._id).populate("senderId", "name avatar photo").lean();

        // Send to receiver
        emitToUser(receiverId, "new_message", populatedMessage);
        emitToUser(receiverId, "update_conversation", updatedConversation);

        // Send to sender (to sync other devices)
        emitToUser(senderId, "update_conversation", updatedConversation);
    }

    return newMessage;
};

/**
 * Send an offer message
 */
const sendOffer = async (senderId: string, payload: { receiverId: string; productId: string; offerPrice: number; text?: string }) => {
    return sendMessage(senderId, {
        ...payload,
        type: "OFFER",
    } as any);
};

/**
 * Share location message
 */
const shareLocation = async (
    senderId: string,
    payload: {
        receiverId: string;
        location: {
            fullAddress: string;
            latitude: number;
            longitude: number;
        };
        text?: string;
    },
) => {
    return sendMessage(senderId, {
        ...payload,
        type: "LOCATION",
    } as any);
};

/**
 * Update offer status (ACCEPTED, REJECTED, COMPLETED)
 */
const updateOfferStatus = async (senderId: string, payload: { receiverId: string; conversationId: string; type: "ACCEPTED" | "REJECTED" | "COMPLETED"; text?: string }) => {
    const { receiverId, ...messageData } = payload;

    return sendMessage(senderId, {
        ...messageData,
        receiverId,
    } as any);
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
            { path: "participantIds", select: "name avatar photo phone" },
            { path: "productId", select: "title images price" },
            {
                path: "lastMessage",
                populate: { path: "senderId", select: "name avatar photo" },
            },
        ])
        .sort({ updatedAt: -1 })
        .lean();
};

/**
 * Get messages for a specific conversation
 */
const getMessages = async (userId: string, conversationId: string) => {
    // 1. Check access
    const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participantIds: userId,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found or access denied");
    }

    // 2. Mark as read
    await ConversationModel.markMessageAsRead(conversationId, userId);

    // 3. Notify other participant that messages were read
    const otherParticipantId = conversation.participantIds.find((id) => id.toString() !== userId.toString());
    if (otherParticipantId) {
        emitToUser(otherParticipantId.toString(), "messages_read", {
            conversationId,
            readBy: userId,
        });
    }

    // 4. Get messages (lean for performance)
    return await MessageModel.find({
        conversationId,
        deletedBy: { $ne: new Types.ObjectId(userId) },
        isDeleted: false,
    })
        .populate("senderId", "name avatar photo")
        .sort({ createdAt: 1 })
        .lean();
};

/**
 * Delete a conversation for the current user
 */
const deleteConversation = async (userId: string, conversationId: string) => {
    const result = await ConversationModel.updateOne({ _id: conversationId, participantIds: userId }, { $addToSet: { deletedBy: userId } });

    if (result.matchedCount === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    // Sync other devices for the same user
    emitToUser(userId, "conversation_deleted", { conversationId });

    return { message: "Conversation deleted successfully" };
};

/**
 * Delete a specific message for the current user
 */
const deleteMessage = async (userId: string, messageId: string) => {
    const result = await MessageModel.updateOne({ _id: messageId, $or: [{ senderId: userId }, { conversationId: { $exists: true } }] }, { $addToSet: { deletedBy: userId } });

    if (result.matchedCount === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    // Sync other devices for the same user
    emitToUser(userId, "message_deleted", { messageId });

    return { message: "Message deleted successfully" };
};

export const messageServices = {
    sendMessage,
    sendOffer,
    shareLocation,
    updateOfferStatus,
    getMyConversations,
    getMessages,
    deleteConversation,
    deleteMessage,
};
