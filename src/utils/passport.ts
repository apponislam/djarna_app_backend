import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { UserModel } from "../app/modules/auth/auth.model";
import config from "../app/config";

let AppleStrategy: any;
try {
    AppleStrategy = require("passport-apple").Strategy;
} catch (e) {
    AppleStrategy = class {} as any;
}

// Serialize user
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await UserModel.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// ================= GOOGLE =================
passport.use(
    new GoogleStrategy(
        {
            clientID: config.google.clientID as string,
            clientSecret: config.google.clientSecret as string,
            callbackURL: config.google.callbackURL,
        },
        async (_accessToken: any, _refreshToken: any, profile: any, done: (error: any, user?: any, info?: any) => void) => {
            try {
                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(null, false);
                }

                let user = await UserModel.findOne({ email });

                if (!user) {
                    // Note: UserModel requires 'phone' and 'password' which are not provided by Google.
                    // For now, we return false. The user should register with a phone number first.
                    return done(null, false);
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error, false);
            }
        },
    ),
);

// ================= FACEBOOK =================
passport.use(
    new FacebookStrategy(
        {
            clientID: config.facebook.appID as string,
            clientSecret: config.facebook.appSecret as string,
            callbackURL: config.facebook.callbackURL,
            profileFields: ["id", "emails", "name", "displayName"],
        },
        async (_accessToken: any, _refreshToken: any, profile: any, done: (error: any, user?: any, info?: any) => void) => {
            try {
                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(null, false);
                }

                let user = await UserModel.findOne({ email });

                if (!user) {
                    // Note: UserModel requires 'phone' and 'password' which are not provided by Facebook.
                    // For now, we return false. The user should register with a phone number first.
                    return done(null, false);
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error, false);
            }
        },
    ),
);

// ================= APPLE =================
passport.use(
    "apple",
    new AppleStrategy(
        {
            clientID: config.apple.clientID as string,
            teamID: config.apple.teamID as string,
            keyID: config.apple.keyID as string,
            privateKey: config.apple.privateKey as string,
            callbackURL: config.apple.callbackURL,
            scope: ["email"],
        },
        async (_accessToken: any, _refreshToken: any, profile: any, done: (error: any, user?: any, info?: any) => void) => {
            try {
                const email = profile.email;

                if (!email) {
                    return done(null, false);
                }

                let user = await UserModel.findOne({ email });

                if (!user) {
                    // Note: UserModel requires 'phone' and 'password' which are not provided by Apple.
                    // For now, we return false. The user should register with a phone number first.
                    return done(null, false);
                }

                return done(null, user);
            } catch (error) {
                return done(error as Error, false);
            }
        },
    ),
);

export default passport;
