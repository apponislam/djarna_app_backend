import { Schema, model } from "mongoose";
import { IFavorite } from "./favorite.interface";

const favoriteSchema = new Schema<IFavorite>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// Prevent duplicate favorites
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

export const FavoriteModel = model<IFavorite>("Favorite", favoriteSchema);
