import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    ip: process.env.IP,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    mongodb_url: process.env.MONGODB_URL,
    // botEmail: process.env.BOTEMAIL,
    // botPassword: process.env.BOTPASSWORD,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    jwt_access_expire: process.env.JWT_ACCESS_EXPIRE,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_refresh_expire: process.env.JWT_REFRESH_EXPIRE,
    jwt_password_reset_secret: process.env.JWT_PASSWORD_RESET_SECRET,
    client_url: process.env.CLIENT_URL,
    mail: {
        smtp_host: process.env.SMTP_HOST,
        smtp_port: process.env.SMTP_PORT,
        smtp_secure: process.env.SMTP_SECURE,
        smtp_user: process.env.SMTP_USER,
        smtp_pass: process.env.SMTP_PASS,
    },
    superAdminPassword: process.env.SUPERADMINPASSWORD,
    superAdminPhone: process.env.SUPERADMINPHONE,
    superAdminEmail: process.env.SUPERADMINEMAIL,

    // Twilio Config
    twilio_account_sid: process.env.TWILIO_ACCOUNT_SID,
    twilio_auth_token: process.env.TWILIO_AUTH_TOKEN,
    twilio_phone_number: process.env.TWILIO_PHONE_NUMBER,

    // Payment Config
    paydunya_mode: process.env.PAYDUNYA_MODE || "sandbox",
    paydunya_master_key: process.env.PAYDUNYA_MASTER_KEY,
    paydunya_public_key: process.env.PAYDUNYA_PUBLIC_KEY,
    paydunya_private_key: process.env.PAYDUNYA_PRIVATE_KEY,
    paydunya_token: process.env.PAYDUNYA_TOKEN,

    // OAuth Config
    google: {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/v1/auth/google/callback",
    },
    facebook: {
        appID: process.env.FACEBOOK_APP_ID,
        appSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || "/api/v1/auth/facebook/callback",
    },
    apple: {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY,
        callbackURL: process.env.APPLE_CALLBACK_URL || "/api/v1/auth/apple/callback",
    },
};
