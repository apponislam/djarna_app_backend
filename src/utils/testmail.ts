import nodemailer from "nodemailer";
import config from "../app/config";

export const testMail = async () => {
    try {
        console.log("⚡ Sending test email via SMTP configuration from config...");

        const transporter = nodemailer.createTransport({
            host: config.mail.smtp_host,
            port: Number(config.mail.smtp_port),
            secure: config.mail.smtp_secure === "true",
            auth: {
                user: config.mail.smtp_user,
                pass: config.mail.smtp_pass,
            },
        } as nodemailer.TransportOptions);

        const info = await transporter.sendMail({
            from: `"${config.mail.smtp_user}" <${config.mail.smtp_user}>`,
            to: "apponislamdev@gmail.com",
            subject: "Test Email from Your App",
            html: "<h1>✅ SMTP Test Successful!</h1><p>This is a test email from your app.</p>",
        });

        console.log("📨 Test email sent successfully!");
        console.log("Response Info:", info);
    } catch (err) {
        console.error("❌ Failed to send test email:", err);
    }
};
