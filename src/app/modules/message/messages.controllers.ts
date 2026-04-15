import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { Request, Response } from "express";
import { messageServices } from "./messages.services";

/**
 * Send a message (creates a new conversation if it doesn't exist)
 */
const sendMessage = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await messageServices.sendMessage(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Message sent successfully",
        data: result,
    });
});

/**
 * Send an offer
 */
const sendOffer = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await messageServices.sendOffer(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Offer sent successfully",
        data: result,
    });
});

/**
 * Share location
 */
const shareLocation = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await messageServices.shareLocation(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Location shared successfully",
        data: result,
    });
});

/**
 * Update offer status
 */
const updateOfferStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await messageServices.updateOfferStatus(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Offer status updated successfully",
        data: result,
    });
});

/**
 * Get all conversations for the authenticated user
 */
const getMyConversations = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await messageServices.getMyConversations(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Conversations retrieved successfully",
        data: result,
    });
});

/**
 * Get messages from a specific conversation
 */
const getMessages = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const result = await messageServices.getMessages(userId, conversationId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Messages retrieved successfully",
        data: result,
    });
});

/**
 * Delete a conversation for the user
 */
const deleteConversation = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const result = await messageServices.deleteConversation(userId, conversationId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

/**
 * Delete a specific message for the user
 */
const deleteMessage = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const { messageId } = req.params;
    const result = await messageServices.deleteMessage(userId, messageId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result.message,
        data: null,
    });
});

export const messageControllers = {
    sendMessage,
    sendOffer,
    shareLocation,
    updateOfferStatus,
    getMyConversations,
    getMessages,
    deleteConversation,
    deleteMessage,
};
