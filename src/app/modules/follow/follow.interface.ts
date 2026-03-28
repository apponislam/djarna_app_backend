import { Types } from "mongoose";

export interface IFollow {
    follower: Types.ObjectId;
    following: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}
