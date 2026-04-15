import bcrypt from "bcrypt";
import { UserModel } from "./auth.model";
import config from "../../config";

export const seedAdmin = async () => {
    try {
        const adminExists = await UserModel.findOne({
            role: "ADMIN",
        });

        if (!adminExists) {
            console.log("📝 No admin found, creating one...");

            const hashedPassword = await bcrypt.hash(config.superAdminPassword as string, Number(config.bcrypt_salt_rounds));

            const superAdmin = {
                name: "Admin",
                email: config.superAdminEmail,
                password: hashedPassword,
                role: "ADMIN",
                phone: "0000000000",
                isActive: true,
                isPhoneVerified: true,
            };

            await UserModel.create(superAdmin);

            console.log("✅ Admin created:", config.superAdminEmail);
        } else {
            console.log("✅ Admin already exists, skipping creation");
        }
    } catch (error) {
        console.error("❌ Error seeding super admin:", error);
    }
};
