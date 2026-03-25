import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import sharp from "sharp";

// Ensure upload directory exists
const profileImageDir = path.join(process.cwd(), "uploads", "profile-images");
if (!fs.existsSync(profileImageDir)) fs.mkdirSync(profileImageDir, { recursive: true });

const categoryIconDir = path.join(process.cwd(), "uploads", "categories");
if (!fs.existsSync(categoryIconDir)) fs.mkdirSync(categoryIconDir, { recursive: true });

// Multer memory storage
const storage = multer.memoryStorage();

// File filter (only allow images)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Image must be JPG, PNG, or WEBP"));
};

// Multer setup
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Helper to generate unique filename
const generateFileName = (prefix: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${randomNum}.webp`;
};

// Middleware for single profile image upload
export const uploadProfileImage = (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = upload.single("profileImage");

    uploadSingle(req, res, async (err) => {
        if (err) return next(err);

        // Process profileImage file if uploaded
        if (req.file) {
            try {
                const file = req.file;
                const newName = generateFileName("profile");
                const outputPath = path.join(profileImageDir, newName);

                // Convert to webp
                await sharp(file.buffer).webp({ quality: 80 }).toFile(outputPath);

                file.filename = newName;
                file.path = `/uploads/profile-images/${newName}`;
                file.mimetype = "image/webp";
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};

// Middleware for single category icon upload
export const uploadCategoryIcon = (req: Request, res: Response, next: NextFunction) => {
    const uploadSingle = upload.single("icon");

    uploadSingle(req, res, async (err) => {
        if (err) return next(err);

        // Process icon file if uploaded
        if (req.file) {
            try {
                const file = req.file;
                const newName = generateFileName("category");
                const outputPath = path.join(categoryIconDir, newName);

                // Compress and convert to webp
                await sharp(file.buffer)
                    .resize(200, 200, { fit: "cover" }) // Resize for icon
                    .webp({ quality: 70 })
                    .toFile(outputPath);

                file.filename = newName;
                file.path = `/uploads/categories/${newName}`;
                file.mimetype = "image/webp";
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};
