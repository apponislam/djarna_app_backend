import { Router } from "express";
import { ProductController } from "./product.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { createProductSchema, updateProductStatusSchema, boostProductSchema } from "./product.validations";
import auth from "../../middlewares/auth";
import { uploadProductImages } from "../../middlewares/multer";

const router = Router();

// Public routes
router.get("/", ProductController.getAllProducts);
router.get("/:id", ProductController.getProductById);

// Protected User routes
router.post("/", auth, uploadProductImages, validateRequest(createProductSchema), ProductController.createProduct);
router.patch("/:id/status", auth, validateRequest(updateProductStatusSchema), ProductController.updateProductStatus);
router.post("/:id/boost", auth, validateRequest(boostProductSchema), ProductController.boostProduct);
router.delete("/:id", auth, ProductController.deleteProduct);

export const ProductRoutes = router;
