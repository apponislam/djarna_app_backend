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

const productImageDir = path.join(process.cwd(), "uploads", "products");
if (!fs.existsSync(productImageDir)) fs.mkdirSync(productImageDir, { recursive: true });

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
    const uploadSingle = upload.single("photo");

    uploadSingle(req, res, async (err) => {
        if (err) return next(err);

        // Process photo file if uploaded
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

// Middleware for multiple product image uploads
export const uploadProductImages = (req: Request, res: Response, next: NextFunction) => {
    const uploadMultiple = upload.array("images", 5); // Allow up to 5 images

    uploadMultiple(req, res, async (err) => {
        if (err) return next(err);

        if (req.files && Array.isArray(req.files)) {
            try {
                const processedFiles = await Promise.all(
                    (req.files as Express.Multer.File[]).map(async (file, index) => {
                        const newName = generateFileName(`product-${index}`);
                        const outputPath = path.join(productImageDir, newName);

                        // Compress and convert to webp
                        await sharp(file.buffer).resize(800, 800, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(outputPath);

                        file.filename = newName;
                        file.path = `/uploads/products/${newName}`;
                        file.mimetype = "image/webp";
                        return file;
                    }),
                );
                req.files = processedFiles;
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};
