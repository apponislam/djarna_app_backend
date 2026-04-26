import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import httpStatus from "http-status";
import { OrderService } from "./order.services";
import { Request, Response } from "express";

const createOrder = catchAsync(async (req: Request, res: Response) => {
    const buyerId = req.user._id;
    const result = await OrderService.createOrder(buyerId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Order created successfully",
        data: result,
    });
});

const getMyOrders = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const role = req.query.role as "buyer" | "seller" || "buyer";
    const result = await OrderService.getMyOrders(userId, role);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Orders retrieved successfully",
        data: result,
    });
});

const getOrderById = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await OrderService.getOrderById(req.params.id as string, userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order retrieved successfully",
        data: result,
    });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user._id;
    const result = await OrderService.updateOrderStatus(req.params.id as string, userId, req.body.status);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order status updated successfully",
        data: result,
    });
});

export const OrderController = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
};
