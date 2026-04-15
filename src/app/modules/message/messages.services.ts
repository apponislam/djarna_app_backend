import httpStatus from "http-status";
import { Types } from "mongoose";
import ApiError from "../../../errors/ApiError";
import { ConversationModel, MessageModel } from "./messages.model";
import { Message } from "./messages.interface";

/**
 * Send a new message or start a conversation
 */
const sendMessage = async (senderId: string, payload: Partial<Message> & { receiverId: string }) => {
    const { receiverId, ...messageData } = payload;

    // Find or create a private conversation between these two users
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

    // Create the message
    const newMessage = await MessageModel.create({
        ...messageData,
        conversationId: conversation._id,
        senderId,
    });

    // Update conversation's last message and unread count
    await ConversationModel.updateOne(
        { _id: conversation._id },
        {
            $set: { lastMessage: newMessage._id },
            $inc: { "unreadCounts.$[elem].count": 1 },
            // If the conversation was previously deleted by someone, remove them from deletedBy
            $pull: { deletedBy: { $in: [senderId, receiverId] } },
        },
        {
            arrayFilters: [{ "elem.userId": receiverId }],
        },
    );

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
    const conversations = await ConversationModel.find({
        participantIds: userId,
        deletedBy: { $ne: new Types.ObjectId(userId) },
    })
        .populate("participantIds", "name avatar phone")
        .populate("lastMessage")
        .populate("productId", "title images price")
        .sort({ updatedAt: -1 });

    return conversations;
};

/**
 * Get messages for a specific conversation
 */
const getMessages = async (userId: string, conversationId: string) => {
    // Check if conversation exists and user is a participant
    const conversation = await ConversationModel.findOne({
        _id: conversationId,
        participantIds: userId,
    });

    if (!conversation) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found or access denied");
    }

    // Mark messages as read for this user
    await ConversationModel.markMessageAsRead(conversationId, userId);

    // Get messages that are NOT deleted by this user
    const messages = await MessageModel.find({
        conversationId,
        deletedBy: { $ne: new Types.ObjectId(userId) },
        isDeleted: false,
    })
        .populate("senderId", "name avatar")
        .sort({ createdAt: 1 });

    return messages;
};

/**
 * Delete a conversation for the current user
 */
const deleteConversation = async (userId: string, conversationId: string) => {
    const result = await ConversationModel.updateOne({ _id: conversationId, participantIds: userId }, { $addToSet: { deletedBy: userId } });

    if (result.matchedCount === 0) {
        throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
    }

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
