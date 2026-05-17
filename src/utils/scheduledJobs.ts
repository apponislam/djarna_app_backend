import cron from "node-cron";
import { ProductModel } from "../app/modules/product/product.model";
import { PaymentModel } from "../app/modules/payment/payment.model";
import { UserModel } from "../app/modules/auth/auth.model";
import { OrderModel } from "../app/modules/order/order.model";
import { NotificationUtils } from "./notification";

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

export const runEscrowRelease = async () => {
    try {
        const now = new Date();

        // Find all payments where escrow is true, escrowReleaseAt has passed, and not yet released
        const paymentsToRelease = await PaymentModel.find({
            escrow: true,
            escrowReleaseAt: { $lt: now },
            escrowReleasedAt: { $exists: false },
        });

        if (paymentsToRelease.length === 0) {
            return;
        }

        console.log(`💰 Found ${paymentsToRelease.length} payments ready for escrow release.`);

        for (const payment of paymentsToRelease) {
            try {
                // Update seller balance
                if (payment.sellerId) {
                    const sellerBalanceIncrease = (payment.buyerFee || 0) + (payment.shippingCost || 0);
                    const updateData: any = { $inc: { balance: sellerBalanceIncrease } };

                    // If this was a zero-commission payment, decrement the seller's noCommission count
                    if (payment.siteFee === 0 && (payment.productPrice || 0) > 0) {
                        updateData.$inc.noCommission = -1;
                    }

                    await UserModel.findByIdAndUpdate(payment.sellerId, updateData);

                    // Notify Seller about escrow release
                    const seller = await UserModel.findById(payment.sellerId);
                    if (seller?.fcmTokens && seller.fcmTokens.length > 0) {
                        await NotificationUtils.sendPushNotification(seller.fcmTokens, "Funds Released!", `Your escrowed funds of ${sellerBalanceIncrease} FCFA have been released to your balance.`);
                    }
                }

                // Mark payment as released
                payment.escrowReleasedAt = now;
                await payment.save();

                // Find and update the associated order to COMPLETED
                const order = await OrderModel.findOne({ payment: payment._id });
                if (order) {
                    order.status = "COMPLETED";
                    await order.save();

                    // Mark product as SOLD
                    await ProductModel.findByIdAndUpdate(order.product, { status: "SOLD" });
                }

                console.log(`✅ Released escrow for payment ${payment._id} and marked order as COMPLETED`);
            } catch (error) {
                console.error(`❌ Failed to release escrow for payment ${payment._id}:`, error);
            }
        }
    } catch (error) {
        console.error("❌ Error running escrow release:", error);
    }
};

export const startScheduledJobs = () => {
    // Run once immediately on server start
    runBoostCleanup();
    runEscrowRelease();

    // Schedule boost cleanup to run every 12 hours
    cron.schedule("0 */12 * * *", () => {
        console.log("Boost cleanup Cron Job triggered.");
        runBoostCleanup();
    });

    // Schedule escrow release to run every hour
    cron.schedule("0 * * * *", () => {
        console.log("Escrow release Cron Job triggered.");
        runEscrowRelease();
    });

    console.log("⏱️ Scheduled jobs started (Boost cleanup every 12 hours, Escrow release every hour).");
};
