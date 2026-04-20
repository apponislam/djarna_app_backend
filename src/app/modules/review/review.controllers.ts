import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ReviewService } from "./review.services";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ReviewService.createReview(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Review created successfully",
        data: result,
    });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await ReviewService.getUserReviews(userId, { page, limit });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "My reviews retrieved successfully",
        meta: result.meta,
        data: {
            stats: result.stats,
            reviews: result.data,
        },
    });
});

const getUserReviews = catchAsync(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const result = await ReviewService.getUserReviews(userId as string, { page, limit });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "User reviews retrieved successfully",
        meta: result.meta,
        data: {
            stats: result.stats,
            reviews: result.data,
        },
    });
});

const getProductReviews = catchAsync(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const result = await ReviewService.getProductReviews(productId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Product reviews retrieved successfully",
        data: result,
    });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const searchTerm = req.query.searchTerm as string;

    const result = await ReviewService.getAllReviews({ page, limit, searchTerm });

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "All reviews retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?._id;
    const isAdmin = req.user?.role === "ADMIN";

    const result = await ReviewService.deleteReview(id as string, userId, isAdmin);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review deleted successfully",
        data: result,
    });
});

const updateReviewVisibility = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { adminVisibility } = req.body;

    const result = await ReviewService.updateReviewVisibility(id as string, adminVisibility);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Review visibility updated successfully",
        data: result,
    });
});

export const ReviewController = {
    createReview,
    getMyReviews,
    getUserReviews,
    getProductReviews,
    getAllReviews,
    deleteReview,
    updateReviewVisibility,
};
