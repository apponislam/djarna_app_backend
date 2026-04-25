import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ShippingAddressService } from "./address.services";

const addAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ShippingAddressService.addAddress(userId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Address added successfully",
        data: result,
    });
});

const getMyAddresses = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ShippingAddressService.getMyAddresses(userId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Addresses retrieved successfully",
        data: result,
    });
});

const updateAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;
    const result = await ShippingAddressService.updateAddress(userId, id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Address updated successfully",
        data: result,
    });
});

const deleteAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;
    await ShippingAddressService.deleteAddress(userId, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Address deleted successfully",
        data: null,
    });
});

const setDefaultAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;
    const result = await ShippingAddressService.setDefaultAddress(userId, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Default address updated successfully",
        data: result,
    });
});

export const ShippingAddressController = {
    addAddress,
    getMyAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
};
