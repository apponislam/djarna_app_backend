import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../utils/catchAsync";
import sendResponse from "../../../utils/sendResponse";
import { ShippingAddressService } from "./address.services";

const addAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ShippingAddressService.addAddress(userId as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Adresse ajoutée avec succès",
        data: result,
    });
});

const getMyAddresses = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const result = await ShippingAddressService.getMyAddresses(userId as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Adresses récupérées avec succès",
        data: result,
    });
});

const updateAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;
    const result = await ShippingAddressService.updateAddress(userId as string, id as string, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Adresse mise à jour avec succès",
        data: result,
    });
});

const deleteAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;
    await ShippingAddressService.deleteAddress(userId as string, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Adresse supprimée avec succès",
        data: null,
    });
});

const setDefaultAddress = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { id } = req.params;
    const result = await ShippingAddressService.setDefaultAddress(userId as string, id as string);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Adresse par défaut mise à jour avec succès",
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
