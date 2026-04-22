import cron from "node-cron";
import { ProductModel } from "../app/modules/product/product.model";
import { UserModel } from "../app/modules/auth/auth.model";

export const runBoostCleanup = async () => {
    try {
        const now = new Date();

        // Cleanup expired product boosts
        const expiredProducts = await ProductModel.updateMany(
            {
                isBoosted: true,
                boostEndTime: { $lt: now },
            },
            {
                $set: {
                    isBoosted: false,
                    boostPack: null,
                    boostStartTime: null,
                    boostEndTime: null,
                },
            },
        );

        if (expiredProducts.modifiedCount > 0) {
            console.log(`🧹 Cleaned up ${expiredProducts.modifiedCount} expired product boosts.`);
        }

        // Cleanup expired shop (user) boosts
        const expiredUsers = await UserModel.updateMany(
            {
                isBoosted: true,
                boostEndTime: { $lt: now },
            },
            {
                $set: {
                    isBoosted: false,
                    boostPack: null,
                    boostStartTime: null,
                    boostEndTime: null,
                },
            },
        );

        if (expiredUsers.modifiedCount > 0) {
            console.log(`🧹 Cleaned up ${expiredUsers.modifiedCount} expired shop boosts.`);
        }
    } catch (error) {
        console.error("❌ Error running boost cleanup:", error);
    }
};

export const startBoostCleanupTask = () => {
    // Run once immediately on server start
    runBoostCleanup();

    // Schedule to run every minute
    cron.schedule("* * * * *", () => {
        runBoostCleanup();
    });

    console.log("⏱️ Boost cleanup Cron Job started (Running every minute).");
};
