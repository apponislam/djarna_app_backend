import cron from "node-cron";
import { ProductModel } from "../app/modules/product/product.model";
import { PaymentModel } from "../app/modules/payment/payment.model";
import { UserModel } from "../app/modules/auth/auth.model";
import { OrderModel } from "../app/modules/order/order.model";
import { NotificationUtils } from "./notification";

export const runBoostCleanup = async () => {
    try {
        const now = new Date();

        // Find expired product boosts first to get user IDs
        const expiredProducts = await ProductModel.find({
            isBoosted: true,
            boostEndTime: { $lt: now },
        });

        if (expiredProducts.length > 0) {
            // Send notifications for each expired boost
            for (const product of expiredProducts) {
                const user = await UserModel.findById(product.user);
                if (user?.fcmTokens && user.fcmTokens.length > 0) {
                    await NotificationUtils.sendPushNotification(
                        user.fcmTokens,
                        "Boost Ended",
                        `Your product "${product.title}" boost has expired.`,
                        product.user.toString(),
                        "PRODUIT_MIS_EN_AVANT",
                        {
                            screen: "product_detail",
                            productId: product._id.toString(),
                        }
                    );
                }
            }

            // Now update all expired products
            await ProductModel.updateMany(
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

            console.log(`🧹 Cleaned up ${expiredProducts.length} expired product boosts and sent notifications.`);
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

                    await UserModel.findByIdAndUpdate(payment.sellerId, updateData);

                    // Notify Seller about escrow release
                    const seller = await UserModel.findById(payment.sellerId);
                    if (seller?.fcmTokens && seller.fcmTokens.length > 0) {
                        const order = await OrderModel.findOne({ payment: payment._id });
                        await NotificationUtils.sendPushNotification(
                            seller.fcmTokens,
                            "Funds Released!",
                            `Your escrowed funds of ${sellerBalanceIncrease} FCFA have been released to your balance.`,
                            payment.sellerId.toString(),
                            "PAIEMENT_EFFECTUE",
                            {
                                screen: "order_detail",
                                orderId: order ? order._id.toString() : "",
                            }
                        );
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
