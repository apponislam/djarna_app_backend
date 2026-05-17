import admin from "./firebase";
import { notificationServices } from "../app/modules/notification/notification.services";

/**
 * Send push notification to multiple tokens AND save to database
 */
const sendPushNotification = async (
    tokens: string[], 
    title: string, 
    body: string, 
    userId?: string,
    type?: string,
    data?: Record<string, string>
) => {
    // Send push notification via Firebase
    if (tokens && tokens.length > 0) {
        const message = {
            notification: {
                title,
                body,
            },
            data: data || {},
            tokens: tokens,
        };

        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`[NOTIFICATION] Success: ${response.successCount} sent, ${response.failureCount} failed.`);
            
            // Clean up failed tokens if needed (optional)
            if (response.failureCount > 0) {
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        console.error(`[NOTIFICATION] Error for token ${tokens[idx]}:`, resp.error);
                    }
                });
            }
        } catch (error) {
            console.error("[NOTIFICATION] Error sending push notifications:", error);
        }
    }

    // Save notification to database if userId and type are provided
    if (userId && type) {
        try {
            await notificationServices.sendNotification(userId, type, title, body, data);
            console.log(`[NOTIFICATION] Saved to database for user ${userId}`);
        } catch (error) {
            console.error("[NOTIFICATION] Error saving to database:", error);
        }
    }
};

export const NotificationUtils = {
    sendPushNotification,
};
