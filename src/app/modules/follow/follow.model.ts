import { Schema, model } from "mongoose";
import { IFollow } from "./follow.interface";

const followSchema = new Schema<IFollow>(
    {
        follower: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        following: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
);

// prevent duplicate follow
followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

export const FollowModel = model<IFollow>("Follow", followSchema);
