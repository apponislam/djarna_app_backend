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

const messageFileDir = path.join(process.cwd(), "uploads", "messages");
if (!fs.existsSync(messageFileDir)) fs.mkdirSync(messageFileDir, { recursive: true });

const verificationDir = path.join(process.cwd(), "uploads", "verifications");
if (!fs.existsSync(verificationDir)) fs.mkdirSync(verificationDir, { recursive: true });

const disputeImageDir = path.join(process.cwd(), "uploads", "disputes");
if (!fs.existsSync(disputeImageDir)) fs.mkdirSync(disputeImageDir, { recursive: true });

// Multer memory storage
const storage = multer.memoryStorage();

// File filter (only allow images)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    // console.log("📸 Uploaded file mimetype:", file.mimetype);
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

// Multer setup for general files (no filter for file types, used in messaging)
const uploadAny = multer({
    storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
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

// Middleware for multiple dispute image uploads
export const uploadDisputeImages = (req: Request, res: Response, next: NextFunction) => {
    const uploadMultiple = upload.array("images", 5); // Allow up to 5 images

    uploadMultiple(req, res, async (err) => {
        if (err) return next(err);

        if (req.files && Array.isArray(req.files)) {
            try {
                const processedFiles = await Promise.all(
                    (req.files as Express.Multer.File[]).map(async (file, index) => {
                        const newName = generateFileName(`dispute-${index}`);
                        const outputPath = path.join(disputeImageDir, newName);

                        // Compress and convert to webp
                        await sharp(file.buffer).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(outputPath);

                        file.filename = newName;
                        file.path = `/uploads/disputes/${newName}`;
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

// Middleware for identity verification document uploads
export const uploadVerificationDocs = (req: Request, res: Response, next: NextFunction) => {
    const uploadFields = upload.fields([
        { name: "frontImage", maxCount: 1 },
        { name: "backImage", maxCount: 1 },
        { name: "selfieImage", maxCount: 1 },
    ]);

    uploadFields(req, res, async (err) => {
        if (err) return next(err);

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        if (files) {
            try {
                for (const field of ["frontImage", "backImage", "selfieImage"]) {
                    if (files[field] && files[field][0]) {
                        const file = files[field][0];
                        const newName = generateFileName(`verify-${field}`);
                        const outputPath = path.join(verificationDir, newName);

                        // Compress and convert to webp
                        await sharp(file.buffer).resize(1200, 1200, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(outputPath);

                        file.filename = newName;
                        file.path = `/uploads/verifications/${newName}`;
                        file.mimetype = "image/webp";
                    }
                }
            } catch (error) {
                return next(error);
            }
        }

        next();
    });
};

// Middleware to parse JSON data from multipart form
export const parseBodyData = (req: Request, res: Response, next: NextFunction) => {
    // Check for both 'data' and 'body' fields as common JSON container names
    const jsonData = req.body.data || req.body.body;

    if (jsonData && typeof jsonData === "string") {
        try {
            req.body = JSON.parse(jsonData);
        } catch (error) {
            return next(new Error("Invalid JSON data in request body"));
        }
    }
    next();
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

// Middleware for multiple message file uploads
export const uploadMessageFiles = (req: Request, res: Response, next: NextFunction) => {
    const uploadMultiple = uploadAny.array("files", 10); // Allow up to 10 files

    uploadMultiple(req, res, async (err) => {
        if (err) return next(err);

        if (req.files && Array.isArray(req.files)) {
            try {
                const processedFiles = await Promise.all(
                    (req.files as Express.Multer.File[]).map(async (file, index) => {
                        const timestamp = Date.now().toString().slice(-6);
                        const randomNum = Math.floor(Math.random() * 10000);
                        
                        let filename = "";
                        let outputPath = "";

                        // Save the file (converting images to webp)
                        if (file.mimetype.startsWith("image/")) {
                            filename = `msg-${timestamp}-${randomNum}.webp`;
                            outputPath = path.join(messageFileDir, filename);
                            
                            await sharp(file.buffer)
                                .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
                                .webp({ quality: 80 })
                                .toFile(outputPath);

                            file.filename = filename;
                            file.path = `/uploads/messages/${filename}`;
                            file.mimetype = "image/webp";
                        } else {
                            filename = `msg-${timestamp}-${randomNum}${path.extname(file.originalname)}`;
                            outputPath = path.join(messageFileDir, filename);
                            
                            fs.writeFileSync(outputPath, file.buffer);
                            
                            file.filename = filename;
                            file.path = `/uploads/messages/${filename}`;
                        }
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
