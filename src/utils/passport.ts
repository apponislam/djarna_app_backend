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
                const name = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim();
                const photo = profile.photos?.[0]?.value;

                // First try to find by oauth provider and id
                let user = await UserModel.findOne({
                    oauthProvider: "GOOGLE",
                    oauthId: profile.id,
                });

                if (user) {
                    return done(null, user);
                }

                // If not found and we have email, try to find by email
                if (email) {
                    user = await UserModel.findOne({ email });
                    if (user) {
                        // Link Google to existing user
                        user.oauthProvider = "GOOGLE";
                        user.oauthId = profile.id;
                        if (!user.photo && photo) {
                            user.photo = photo;
                        }
                        await user.save();
                        return done(null, user);
                    }
                }

                // If we get here, user is new - return false (need phone/password)
                return done(null, false, {
                    message: "User not found. Please register with phone and password first.",
                    tempData: {
                        provider: "GOOGLE",
                        providerId: profile.id,
                        email,
                        name,
                        photo,
                    },
                });
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
            profileFields: ["id", "emails", "name", "displayName", "photos"],
        },
        async (_accessToken: any, _refreshToken: any, profile: any, done: (error: any, user?: any, info?: any) => void) => {
            try {
                const email = profile.emails?.[0]?.value;
                const name = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim();
                const photo = profile.photos?.[0]?.value;

                // First try to find by oauth provider and id
                let user = await UserModel.findOne({
                    oauthProvider: "FACEBOOK",
                    oauthId: profile.id,
                });

                if (user) {
                    return done(null, user);
                }

                // If not found and we have email, try to find by email
                if (email) {
                    user = await UserModel.findOne({ email });
                    if (user) {
                        // Link Facebook to existing user
                        user.oauthProvider = "FACEBOOK";
                        user.oauthId = profile.id;
                        if (!user.photo && photo) {
                            user.photo = photo;
                        }
                        await user.save();
                        return done(null, user);
                    }
                }

                // If we get here, user is new - return false (need phone/password)
                return done(null, false, {
                    message: "User not found. Please register with phone and password first.",
                    tempData: {
                        provider: "FACEBOOK",
                        providerId: profile.id,
                        email,
                        name,
                        photo,
                    },
                });
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
            scope: ["email", "name"],
        },
        async (_accessToken: any, _refreshToken: any, profile: any, done: (error: any, user?: any, info?: any) => void) => {
            try {
                const email = profile.email;
                const name = profile.name ? `${profile.name.firstName || ""} ${profile.name.lastName || ""}`.trim() : "Apple User";

                // First try to find by oauth provider and id
                let user = await UserModel.findOne({
                    oauthProvider: "APPLE",
                    oauthId: profile.id,
                });

                if (user) {
                    return done(null, user);
                }

                // If not found and we have email, try to find by email
                if (email) {
                    user = await UserModel.findOne({ email });
                    if (user) {
                        // Link Apple to existing user
                        user.oauthProvider = "APPLE";
                        user.oauthId = profile.id;
                        await user.save();
                        return done(null, user);
                    }
                }

                // If we get here, user is new - return false (need phone/password)
                return done(null, false, {
                    message: "User not found. Please register with phone and password first.",
                    tempData: {
                        provider: "APPLE",
                        providerId: profile.id,
                        email,
                        name,
                    },
                });
            } catch (error) {
                return done(error as Error, false);
            }
        },
    ),
);

export default passport;
