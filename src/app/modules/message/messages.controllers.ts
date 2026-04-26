import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { messageServices } from "./messages.services";

/**
 * Create a new conversation
 */
const createConversation = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await messageServices.createConversation(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Conversation created successfully",
        data: result,
    });
});

/**
 * Get all conversations for the authenticated user
 */
const getUserConversations = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await messageServices.getMyConversations(userId, page, limit);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Conversations retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

/**
 * Get a specific conversation by ID
 */
const getConversationById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const result = await messageServices.getConversationById(userId, conversationId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Conversation retrieved successfully",
        data: result,
    });
});

/**
 * Mark messages in a conversation as read
 */
const markAsRead = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const result = await messageServices.markAsRead(userId, conversationId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Conversation marked as read",
        data: result,
    });
});

/**
 * Get messages from a specific conversation
 */
const getMessages = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const result = await messageServices.getMessages(userId, conversationId as string, page, limit);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Messages retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

/**
 * Send a message
 */
const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const body = req.body;

    // Handle multiple file uploads
    if (req.files && Array.isArray(req.files)) {
        body.files = (req.files as Express.Multer.File[]).map((file) => ({
            url: file.path,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
        }));
    }

    const result = await messageServices.sendMessage(userId, body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Message sent successfully",
        data: result,
    });
});

/**
 * Accept an offer message
 */
const acceptOffer = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { messageId } = req.params;
    const result = await messageServices.updateOfferStatus(userId, messageId as string, "ACCEPTED");

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Offer accepted successfully",
        data: result,
    });
});

/**
 * Reject an offer message
 */
const rejectOffer = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { messageId } = req.params;
    const result = await messageServices.updateOfferStatus(userId, messageId as string, "REJECTED");

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Offer rejected successfully",
        data: result,
    });
});

/**
 * Edit a specific message
 */
const editMessage = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { messageId } = req.params;
    const result = await messageServices.editMessage(userId, messageId as string, req.body.text);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message edited successfully",
        data: result,
    });
});

/**
 * Delete a specific message (for the user)
 */
const deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { messageId } = req.params;
    const result = await messageServices.deleteMessage(userId, messageId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message deleted successfully",
        data: null,
    });
});

/**
 * Delete a conversation for the user
 */
const deleteConversation = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { conversationId } = req.params;
    await messageServices.deleteConversation(userId, conversationId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Conversation deleted successfully",
        data: null,
    });
});

/**
 * Get a single message by ID
 */
const getSingleMessage = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { messageId } = req.params;
    const result = await messageServices.getSingleMessage(userId, messageId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Message retrieved successfully",
        data: result,
    });
});

export const messageControllers = {
    createConversation,
    getUserConversations,
    getConversationById,
    markAsRead,
    getMessages,
    sendMessage,
    acceptOffer,
    rejectOffer,
    editMessage,
    deleteMessage,
    deleteConversation,
    getSingleMessage,
};
