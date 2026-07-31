import config from "../app/config";

/**
 * Clean and format the phone number for Dexchange SMS.
 * Dexchange requires phone numbers in international format without the leading '+' sign.
 * Example: '+221771234567' -> '221771234567'
 */
const formatPhoneNumber = (phone: string): string => {
    return phone.replace(/^\+/, "").trim();
};

/**
 * Send a single SMS via Dexchange SMS API
 * @param to Recipient phone number (e.g. "+221771234567" or "221771234567")
 * @param body Message content
 */
export const sendSms = async (to: string, body: string) => {
    try {
        const apiKey = config.dexchange_sms_api_key;
        const signature = config.dexchange_sms_signature;

        if (!apiKey) {
            throw new Error("DEXCHANGE_SMS_API_KEY is not configured in environment variables.");
        }

        if (!signature) {
            throw new Error("DEXCHANGE_SMS_SIGNATURE is not configured in environment variables.");
        }

        const formattedNumber = formatPhoneNumber(to);

        const response = await fetch("https://api-v2.dexchange-sms.com/api/v1/send/sms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                signature: signature,
                content: body,
                number: [formattedNumber],
            }),
        });

        const data = await response.json() as any;

        if (!response.ok) {
            throw new Error(data?.message || `Dexchange API responded with status ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error("Dexchange SMS Error:", error);
        throw error;
    }
};

/**
 * Send a verification OTP via Dexchange SMS OTP API
 * @param to Recipient phone number
 */
export const sendVerificationCode = async (to: string) => {
    try {
        const apiKey = config.dexchange_sms_api_key;
        const signature = config.dexchange_sms_signature;

        if (!apiKey) {
            throw new Error("DEXCHANGE_SMS_API_KEY is not configured in environment variables.");
        }

        if (!signature) {
            throw new Error("DEXCHANGE_SMS_SIGNATURE is not configured in environment variables.");
        }

        const formattedNumber = formatPhoneNumber(to);

        const response = await fetch("https://api-v2.dexchange-sms.com/api/v1/send/otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                number: formattedNumber,
                signature: signature,
            }),
        });

        const data = await response.json() as any;

        if (!response.ok) {
            throw new Error(data?.message || `Dexchange Send OTP responded with status ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error("Dexchange Send OTP Error:", error);
        throw error;
    }
};

/**
 * Verify an OTP code via Dexchange SMS OTP API
 * @param to Recipient phone number
 * @param code OTP code to verify
 */
export const checkVerificationCode = async (to: string, code: string): Promise<boolean> => {
    try {
        const apiKey = config.dexchange_sms_api_key;

        if (!apiKey) {
            throw new Error("DEXCHANGE_SMS_API_KEY is not configured in environment variables.");
        }

        const formattedNumber = formatPhoneNumber(to);

        const response = await fetch("https://api-v2.dexchange-sms.com/api/v1/verify/otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                number: formattedNumber,
                otp: code,
            }),
        });

        const data = await response.json() as any;

        if (!response.ok) {
            console.error("Dexchange Verify OTP Error:", data?.message || `Status: ${response.status}`);
            return false;
        }

        // Return true if verification is successful (Dexchange API returns a success message or status)
        return true;
    } catch (error) {
        console.error("Dexchange Verify OTP Exception:", error);
        return false;
    }
};
