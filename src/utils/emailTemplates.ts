import { sendMail } from "./nodemailer";

export const sendVerificationEmail = (email: string, name: string, verificationUrl: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Hello ${name},</h2>
            <p style="color: #666;">Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p style="color: #999; font-size: 12px;">Or copy this link: ${verificationUrl}</p>
            <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
    `;
    sendMail(email, "Verify Your Email", html);
};

export const sendOtpEmail = (email: string, otp: string, name?: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">${name ? `Hello ${name},` : "Hello,"}</h2>
            <p style="color: #666;">Your OTP code is:</p>
            <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px;">
                ${otp}
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 20px;">This code expires in 10 minutes.</p>
        </div>
    `;
    sendMail(email, "Your OTP Code", html);
};

export const sendWelcomeEmail = (email: string, name: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Welcome ${name}!</h2>
            <p style="color: #666;">Thank you for registering. Please verify your email to get started.</p>
        </div>
    `;
    sendMail(email, "Welcome to Our Platform", html);
};

export const sendEmailUpdateVerification = (email: string, name: string, verificationUrl: string) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #333;">Hello ${name},</h2>
            <p style="color: #666;">Please verify your new email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify New Email</a>
            </div>
            <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
    `;
    sendMail(email, "Verify Your New Email", html);
};

export const sendPasswordResetByAdminEmail = (email: string, name: string, newPassword: string) => {
    const html = `
        <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 30px; text-align: center;">
                <h2 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">Password Updated</h2>
            </div>
            <div style="padding: 30px 40px; background-color: #ffffff;">
                <p style="color: #1e293b; font-size: 16px; line-height: 1.6; margin-top: 0;">Hello ${name},</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">Your account password has been reset by the administrator. You can now log in using the temporary credentials below:</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 24px 0;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 90px; font-weight: 500;">Email:</td>
                            <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600; word-break: break-all;">${email}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 14px; color: #64748b; width: 90px; font-weight: 500;">Password:</td>
                            <td style="padding: 6px 0; font-size: 14px; color: #0f172a; font-weight: 600;">
                                <code style="background-color: #cbd5e1; color: #0f172a; padding: 4px 8px; border-radius: 4px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px;">${newPassword}</code>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">If you did not request this change, please contact support.</p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">Support Email: <a href="mailto:contact@djarna.com" style="color: #4f46e5; text-decoration: none; font-weight: 500;">contact@djarna.com</a></p>
                </div>
            </div>
        </div>
    `;
    sendMail(email, "Password Reset by Administrator", html);
};

