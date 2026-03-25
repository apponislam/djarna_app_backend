import { Router } from "express";
import { CategoryController } from "./category.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { createCategorySchema, updateCategorySchema } from "./category.validations";
import auth from "../../middlewares/auth";
import { uploadCategoryIcon } from "../../middlewares/multer";

const router = Router();

// Public routes
router.get("/parents", CategoryController.getParentCategories);
router.get("/subcategories/:parentId", CategoryController.getSubcategoriesByParent);
router.get("/:id", CategoryController.getCategoryById);

// Protected Admin only routes (assuming category management is for admins)
router.post("/", auth, uploadCategoryIcon, validateRequest(createCategorySchema), CategoryController.createCategory);
router.patch("/:id", auth, uploadCategoryIcon, validateRequest(updateCategorySchema), CategoryController.updateCategory);
router.delete("/:id", auth, CategoryController.deleteCategory);

export const CategoryRoutes = router;
