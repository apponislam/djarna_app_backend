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
