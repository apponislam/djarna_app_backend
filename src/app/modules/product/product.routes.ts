import { Router } from "express";
import { ProductController } from "./product.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { createProductSchema, updateProductStatusSchema, boostProductSchema, updateProductSchema } from "./product.validations";
import auth from "../../middlewares/auth";
import checkAuth from "../../middlewares/checkAuth";
import { parseBodyData, uploadProductImages } from "../../middlewares/multer";

const router = Router();

// Public routes
router.get("/", checkAuth, ProductController.getAllProducts);
router.get("/my-products", auth, ProductController.getMyProducts);
router.get("/:id", checkAuth, ProductController.getProductById);

// Protected User routes
router.post("/", auth, uploadProductImages, parseBodyData, validateRequest(createProductSchema), ProductController.createProduct);
router.patch("/:id", auth, uploadProductImages, parseBodyData, validateRequest(updateProductSchema), ProductController.updateProduct);
router.patch("/:id/status", auth, validateRequest(updateProductStatusSchema), ProductController.updateProductStatus);
router.post("/:id/boost", auth, validateRequest(boostProductSchema), ProductController.boostProduct);
router.delete("/:id", auth, ProductController.deleteProduct);

export const ProductRoutes = router;
