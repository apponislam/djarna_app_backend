import { Types } from "mongoose";

export interface IBlock {
    blocker: Types.ObjectId;
    blocked: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
