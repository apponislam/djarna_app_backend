import { Types } from "mongoose";

export interface IFavorite {
    user: Types.ObjectId;
    product: Types.ObjectId;
}
