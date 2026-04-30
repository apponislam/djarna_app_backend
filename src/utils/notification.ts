import admin from "./firebase";

/**
 * Send push notification to multiple tokens
 */
const sendPushNotification = async (tokens: string[], title: string, body: string, data?: Record<string, string>) => {
    if (!tokens || tokens.length === 0) return;

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
};

export const NotificationUtils = {
    sendPushNotification,
};
