import cron from "node-cron";
import { ProductModel } from "../app/modules/product/product.model";

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
    } catch (error) {
        console.error("❌ Error running boost cleanup:", error);
    }
};

export const startScheduledJobs = () => {
    // Run once immediately on server start
    runBoostCleanup();

    // Schedule to run every 12 hours
    cron.schedule("0 */12 * * *", () => {
        console.log("Boost cleanup Cron Job triggered.");
        runBoostCleanup();
    });

    console.log("⏱️ Scheduled jobs started (Boost cleanup runs every 12 hours).");
};
