import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { ShippingAddressModel } from "./address.model";
import { IShippingAddress } from "./address.interface";

const addAddress = async (userId: string, payload: IShippingAddress) => {
    // Check if user already has 2 addresses
    const existingAddressesCount = await ShippingAddressModel.countDocuments({ user: userId, isDeleted: { $ne: true } });
    if (existingAddressesCount >= 2) {
        throw new ApiError(httpStatus.BAD_REQUEST, "You can only have up to 2 shipping addresses");
    }

    // If this is the first address, make it default
    if (existingAddressesCount === 0) {
        payload.isDefault = true;
    }

    // If new address is set as default, unset previous default
    if (payload.isDefault) {
        await ShippingAddressModel.updateMany({ user: userId, isDeleted: { $ne: true } }, { isDefault: false });
    }

    const result = await ShippingAddressModel.create({ ...payload, user: userId });
    return result;
};

const getMyAddresses = async (userId: string) => {
    return await ShippingAddressModel.find({ user: userId, isDeleted: { $ne: true } }).sort({ isDefault: -1, createdAt: -1 });
};

const updateAddress = async (userId: string, addressId: string, payload: Partial<IShippingAddress>) => {
    const address = await ShippingAddressModel.findOne({ _id: addressId, user: userId, isDeleted: { $ne: true } });
    if (!address) {
        throw new ApiError(httpStatus.NOT_FOUND, "Address not found");
    }

    if (payload.isDefault) {
        await ShippingAddressModel.updateMany({ user: userId, isDeleted: { $ne: true } }, { isDefault: false });
    }

    const result = await ShippingAddressModel.findByIdAndUpdate(addressId, payload, { returnDocument: "after" });
    return result;
};

const deleteAddress = async (userId: string, addressId: string) => {
    const address = await ShippingAddressModel.findOne({ _id: addressId, user: userId, isDeleted: { $ne: true } });
    if (!address) {
        throw new ApiError(httpStatus.NOT_FOUND, "Address not found");
    }

    const wasDefault = address.isDefault;
    await ShippingAddressModel.findByIdAndUpdate(addressId, { isDeleted: true, isDefault: false });

    // If deleted address was default, set the most recent one as default
    if (wasDefault) {
        const latestAddress = await ShippingAddressModel.findOne({ user: userId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
        if (latestAddress) {
            latestAddress.isDefault = true;
            await latestAddress.save();
        }
    }

    return null;
};

const setDefaultAddress = async (userId: string, addressId: string) => {
    const address = await ShippingAddressModel.findOne({ _id: addressId, user: userId, isDeleted: { $ne: true } });
    if (!address) {
        throw new ApiError(httpStatus.NOT_FOUND, "Address not found");
    }

    await ShippingAddressModel.updateMany({ user: userId, isDeleted: { $ne: true } }, { isDefault: false });
    const result = await ShippingAddressModel.findByIdAndUpdate(addressId, { isDefault: true }, { returnDocument: "after" });
    return result;
};

export const ShippingAddressService = {
    addAddress,
    getMyAddresses,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
};
