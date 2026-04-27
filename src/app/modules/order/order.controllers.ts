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
    const role = (req.query.role as "buyer" | "seller") || "buyer";
    const { data, meta } = await OrderService.getMyOrders(userId, role, req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Orders retrieved successfully",
        data: data,
        meta: meta,
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

const adminGetOrderById = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderService.adminGetOrderById(req.params.id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order retrieved successfully by admin",
        data: result,
    });
});

const adminGetAllOrders = catchAsync(async (req: Request, res: Response) => {
    const { data, meta } = await OrderService.adminGetAllOrders(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All orders retrieved successfully by admin",
        data: data,
        meta: meta,
    });
});

const adminGetOrderStats = catchAsync(async (req: Request, res: Response) => {
    const result = await OrderService.adminGetOrderStats();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Order statistics retrieved successfully",
        data: result,
    });
});

export const OrderController = {
    createOrder,
    getMyOrders,
    getOrderById,
    updateOrderStatus,
    adminGetAllOrders,
    adminGetOrderById,
    adminGetOrderStats,
};
