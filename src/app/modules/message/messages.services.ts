import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ConversationModel, MessageModel } from "./messages.model";
import { Message, MessageType } from "./messages.interface";
import { emitToUser } from "../../socket/socket";

import { ProductModel } from "../product/product.model";
import { UserModel } from "../auth/auth.model";
import { codec } from "zod";

/**
 * Create a new conversation
 */
const createConversation = async (senderId: string, payload: { receiverId?: string; productId?: string }) => {
    let { receiverId, productId } = payload;
    let productOwner;

    // If productId is provided, find the product and set productOwner and receiverId
    if (productId) {
        const product = await ProductModel.findById(productId);
        if (!product) {
            throw new ApiError(httpStatus.NOT_FOUND, "Product not found!");
        }
        productOwner = product.user.toString();
        // If receiverId is not provided, use the product owner as receiver
        if (!receiverId) {
            receiverId = productOwner;
        }
    }

    if (!receiverId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Receiver ID is required!");
    }

    // Check if receiver exists
    const receiver = await UserModel.findById(receiverId);
    if (!receiver) {
        throw new ApiError(httpStatus.NOT_FOUND, "Receiver user not found!");
    }

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
    } else {
        // If it exists, remove senderId from deletedBy to restore visibility for this user
        // and optionally update product info
        const updateData: any = {
            $pull: { deletedBy: senderId },
        };

        if (productId && !conversation.productId) {
            updateData.$set = {
                productId: productId,
                productOwner: productOwner,
            };
        }

        conversation = (await ConversationModel.findByIdAndUpdate(conversation._id, updateData, { new: true })) as any;
    }

    return await ConversationModel.findById(conversation?._id).populate([
        { path: "participantIds", select: "_id name photo phone verifiedBadge" },
        { path: "productId", select: "_id title images price" },
    ]);
};

/**
 * Send a new message
 */
const sendMessage = async (senderId: string, payload: Partial<Message> & { receiverId?: string }) => {
    if (["ACCEPTED", "REJECTED", "COMPLETED"].includes(payload.type as any)) throw new ApiError(httpStatus.BAD_REQUEST, "Direct send not allowed for this type");

    let { receiverId, ...messageData } = payload;

    // 1. Fetch product info if productId is provided
    if (messageData.productId) {
        const product = await ProductModel.findById(messageData.productId);
        if (!product) {
            throw new ApiError(httpStatus.NOT_FOUND, "Product not found! Please provide a valid productId.");
        }
        // Ensure we have the correct receiver (product owner) if not provided
        if (!receiverId) {
            receiverId = product.user.toString();
        }
        // Always set productOwner and ensure productId is a valid ObjectId
        messageData.productOwner = product.user as any;
        messageData.productId = product._id as any;
    }

    if (!receiverId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Receiver ID is required!");
    }

    // Check if receiver exists
    const receiver = await UserModel.findById(receiverId);
    if (!receiver) {
        throw new ApiError(httpStatus.NOT_FOUND, "Receiver user not found!");
    }

    // 2. Find or Create conversation
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
    } else if (messageData.productId && !conversation.productId) {
        // Update conversation with product info if it was missing
        await ConversationModel.findByIdAndUpdate(conversation._id, {
            $set: {
                productId: messageData.productId,
                productOwner: messageData.productOwner,
            },
        });
    }

    // 3. Create the message
    const newMessage = await MessageModel.create({
        ...messageData,
        type: messageData.type || "MESSAGE",
        conversationId: conversation._id,
        senderId,
    });

    // 4. Update conversation state (lastMessage, unread, etc.)
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
    ).populate([{ path: "participantIds", select: "_id name photo phone verifiedBadge" }, { path: "productId", select: "_id title images price" }, { path: "lastMessage" }]);

    // 4. Emit events
    const messageToEmit = await MessageModel.findById(newMessage._id)
        .populate([
            { path: "senderId", select: "_id name photo verifiedBadge" },
            { path: "productId", select: "_id title images price" },
        ])
        .lean();

    [senderId, receiverId].forEach((id) => {
        emitToUser(id.toString(), "new_message", messageToEmit);
        emitToUser(id.toString(), "update_conversation", updatedConversation);
    });

    return messageToEmit;
};

/**
 * Get all conversations for a user with pagination
 */
const getMyConversations = async (userId: string, page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;

    const query = {
        participantIds: userId,
        deletedBy: { $ne: new Types.ObjectId(userId) },
    };

    const total = await ConversationModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const data = await ConversationModel.find(query)
        .populate([
            { path: "participantIds", select: "_id name photo phone verifiedBadge" },
            { path: "productId", select: "_id title images price" },
            {
                path: "lastMessage",
                populate: { path: "senderId", select: "_id name photo verifiedBadge" },
            },
        ])
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
};

/**
 * Get a specific conversation by ID
 */
const getConversationById = async (userId: string, conversationId: string) => {
    const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participantIds: userId,
    }).populate([
        { path: "participantIds", select: "_id name photo phone verifiedBadge" },
        { path: "productId", select: "_id title images price" },
        {
            path: "lastMessage",
            populate: { path: "senderId", select: "_id name photo verifiedBadge" },
        },
    ]);

    if (!conversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

    return conversation;
};

/**
 * Get messages for a specific conversation with pagination
 */
const getMessages = async (userId: string, conversationId: string, page: number = 1, limit: number = 20) => {
    const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participantIds: userId,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found or access denied");
    }

    // Mark as read
    await markAsRead(userId, conversationId);

    const skip = (page - 1) * limit;

    const query = {
        conversationId,
        deletedBy: { $ne: new Types.ObjectId(userId) },
        isDeleted: false,
    };

    const total = await MessageModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const data = await MessageModel.find(query)
        .populate([
            { path: "senderId", select: "_id name photo verifiedBadge" },
            { path: "productId", select: "_id title images price" },
        ])
        .sort({ createdAt: -1 }) // Get latest messages first for pagination
        .skip(skip)
        .limit(limit)
        .lean();

    return {
        data: data.reverse(), // Reverse to show chronological order for the current page
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
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
    const message = await MessageModel.findOneAndUpdate({ _id: messageId, type: "OFFER" }, { $set: { type: status } }, { new: true }).populate([
        { path: "senderId", select: "_id name photo verifiedBadge" },
        { path: "productId", select: "_id title images price" },
    ]);

    if (!message) throw new ApiError(httpStatus.NOT_FOUND, "Offer message not found");

    const conversation = await ConversationModel.findById(message.conversationId);
    if (conversation) {
        conversation.participantIds.forEach((id) => {
            emitToUser(id.toString(), "message_updated", message);
        });
    }

    return message;
};

/**
 * Edit a specific message
 */
const editMessage = async (userId: string, messageId: string, text: string) => {
    const message = await MessageModel.findOneAndUpdate({ _id: messageId, senderId: userId }, { $set: { text, isEdited: true, editedAt: new Date() } }, { new: true }).populate([
        { path: "senderId", select: "_id name photo verifiedBadge" },
        { path: "productId", select: "_id title images price" },
    ]);

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
    await MessageModel.updateMany({ conversationId }, { $addToSet: { deletedBy: userId } });

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

/**
 * Get a specific message by ID
 */
const getSingleMessage = async (userId: string, messageId: string) => {
    const message = await MessageModel.findOne({
        _id: messageId,
        deletedBy: { $ne: new Types.ObjectId(userId) },
    }).populate([
        { path: "senderId", select: "_id name photo verifiedBadge" },
        { path: "productId", select: "_id title images price" },
    ]);

    if (!message) {
        throw new ApiError(httpStatus.NOT_FOUND, "Message not found");
    }

    // Verify user is part of the conversation
    const conversation = await ConversationModel.findOne({
        _id: message.conversationId,
        participantIds: userId,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.FORBIDDEN, "Access denied");
    }

    return message;
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
    deleteConversation,
    deleteMessage,
    getSingleMessage,
};
