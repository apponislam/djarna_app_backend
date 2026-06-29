import twilio from "twilio";
import config from "../app/config";

const client = twilio(config.twilio_account_sid, config.twilio_auth_token);

export const sendSms = async (to: string, body: string) => {
    try {
        const message = await client.messages.create({
            body,
            from: config.twilio_phone_number,
            to,
        });
        return message;
    } catch (error) {
        console.error("Twilio Error:", error);
        throw error;
    }
};

export const sendVerificationCode = async (to: string) => {
    try {
        if (!config.twilio_verify_service_sid) {
            throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured");
        }
        const verification = await client.verify.v2
            .services(config.twilio_verify_service_sid)
            .verifications.create({ to, channel: "sms" });
        return verification;
    } catch (error) {
        console.error("Twilio Verify Send Error:", error);
        throw error;
    }
};

export const checkVerificationCode = async (to: string, code: string): Promise<boolean> => {
    try {
        if (!config.twilio_verify_service_sid) {
            throw new Error("TWILIO_VERIFY_SERVICE_SID is not configured");
        }
        const verificationCheck = await client.verify.v2
            .services(config.twilio_verify_service_sid)
            .verificationChecks.create({ to, code });
        return verificationCheck.status === "approved";
    } catch (error) {
        console.error("Twilio Verify Check Error:", error);
        return false;
    }
};

