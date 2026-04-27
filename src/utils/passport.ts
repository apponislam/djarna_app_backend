import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { UserModel } from "../app/modules/auth/auth.model";

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
            clientID: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            callbackURL: "/api/v1/auth/google/callback",
        },
        async (_accessToken, _refreshToken, profile, done) => {
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
            clientID: process.env.FACEBOOK_APP_ID as string,
            clientSecret: process.env.FACEBOOK_APP_SECRET as string,
            callbackURL: "/api/v1/auth/facebook/callback",
            profileFields: ["id", "emails", "name", "displayName"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
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

export default passport;
