import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { BoostPackModel } from "./boostPack.model";
import { IBoostPack } from "./boostPack.interface";

const createBoostPack = async (payload: IBoostPack) => {
    // If new pack is recommended, unset others of same type
    if (payload.isRecommended) {
        await BoostPackModel.updateMany({ type: payload.type }, { isRecommended: false });
    }

    const result = await BoostPackModel.create(payload);
    return result;
};

const getAllBoostPacks = async (isAdmin: boolean, type?: string) => {
    // Admins can see all non-deleted packs, users only active and non-deleted ones
    const filters: any = { isDeleted: false };
    if (!isAdmin) {
        filters.isActive = true;
    }
    if (type) {
        filters.type = type;
    }
    const result = await BoostPackModel.find(filters).sort({ price: 1 }).lean();
    return result;
};

const getBoostPackById = async (id: string) => {
    const result = await BoostPackModel.findOne({ _id: id, isDeleted: false }).lean();
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found!");
    }
    return result;
};

const updateBoostPack = async (id: string, payload: Partial<IBoostPack>) => {
    const isExist = await BoostPackModel.findOne({ _id: id, isDeleted: false });
    if (!isExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found!");
    }

    // If setting to recommended, unset others of same type
    if (payload.isRecommended === true) {
        const type = payload.type || isExist.type;
        await BoostPackModel.updateMany({ type }, { isRecommended: false });
    }

    const result = await BoostPackModel.findByIdAndUpdate(id, payload, { new: true });
    return result;
};

const deleteBoostPack = async (id: string) => {
    const isExist = await BoostPackModel.findOne({ _id: id, isDeleted: false });
    if (!isExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found!");
    }
    const result = await BoostPackModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return result;
};

const toggleBoostPackStatus = async (id: string) => {
    const pack = await BoostPackModel.findOne({ _id: id, isDeleted: false });
    if (!pack) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found!");
    }
    pack.isActive = !pack.isActive;
    await pack.save();
    return pack;
};

const setRecommended = async (id: string) => {
    const pack = await BoostPackModel.findOne({ _id: id, isDeleted: false });
    if (!pack) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found!");
    }

    if (pack.isRecommended) {
        // If already recommended, just toggle it off
        pack.isRecommended = false;
    } else {
        // If not recommended, unset all other recommended packs of the same type first
        await BoostPackModel.updateMany({ type: pack.type }, { isRecommended: false });
        // Then set this one as recommended
        pack.isRecommended = true;
    }

    await pack.save();

    return pack;
};

export const BoostPackService = {
    createBoostPack,
    getAllBoostPacks,
    getBoostPackById,
    updateBoostPack,
    deleteBoostPack,
    toggleBoostPackStatus,
    setRecommended,
};
