import { Router } from "express";
import { CategoryController } from "./category.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { createCategorySchema, updateCategorySchema } from "./category.validations";
import auth from "../../middlewares/auth";

const router = Router();

// Public routes
router.get("/", CategoryController.getAllCategories);
router.get("/home-visible", CategoryController.getHomeVisibleCategories);
router.get("/:id", CategoryController.getCategoryById);

// Protected Admin only routes (assuming category management is for admins)
router.post("/", auth, validateRequest(createCategorySchema), CategoryController.createCategory);
router.patch("/:id", auth, validateRequest(updateCategorySchema), CategoryController.updateCategory);
router.delete("/:id", auth, CategoryController.deleteCategory);

export const CategoryRoutes = router;
