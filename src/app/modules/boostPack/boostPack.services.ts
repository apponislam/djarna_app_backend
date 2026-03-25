import httpStatus from "http-status";
import ApiError from "../../../errors/ApiError";
import { BoostPackModel } from "./boostPack.model";
import { IBoostPack } from "./boostPack.interface";

const createBoostPack = async (payload: IBoostPack) => {
    const isExist = await BoostPackModel.findOne({ name: payload.name });
    if (isExist) {
        throw new ApiError(httpStatus.CONFLICT, "Boost pack with this name already exists!");
    }
    const result = await BoostPackModel.create(payload);
    return result;
};

const getAllBoostPacks = async (isAdmin: boolean) => {
    // Admins can see all packs, users only active ones
    const filters: any = {};
    if (!isAdmin) {
        filters.isActive = true;
    }
    const result = await BoostPackModel.find(filters).sort({ price: 1 }).lean();
    return result;
};

const getBoostPackById = async (id: string) => {
    const result = await BoostPackModel.findById(id).lean();
    if (!result) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found!");
    }
    return result;
};

const updateBoostPack = async (id: string, payload: Partial<IBoostPack>) => {
    const isExist = await BoostPackModel.findById(id);
    if (!isExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found!");
    }
    const result = await BoostPackModel.findByIdAndUpdate(id, payload, { new: true });
    return result;
};

const deleteBoostPack = async (id: string) => {
    const isExist = await BoostPackModel.findById(id);
    if (!isExist) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found!");
    }
    const result = await BoostPackModel.findByIdAndDelete(id);
    return result;
};

const toggleBoostPackStatus = async (id: string) => {
    const pack = await BoostPackModel.findById(id);
    if (!pack) {
        throw new ApiError(httpStatus.NOT_FOUND, "Boost pack not found!");
    }
    pack.isActive = !pack.isActive;
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
};
