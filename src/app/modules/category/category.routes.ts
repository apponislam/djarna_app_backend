import { Router } from "express";
import { CategoryController } from "./category.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { createCategorySchema, updateCategorySchema } from "./category.validations";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { uploadCategoryIcon } from "../../middlewares/multer";

const router = Router();

// Public routes
router.get("/parents", CategoryController.getParentCategories);
router.get("/subcategories/:parentId", CategoryController.getSubcategoriesByParent);
router.get("/:id", CategoryController.getCategoryById);

// Admin Dashboard Routes
router.get("/admin/parents", auth, authorize(["ADMIN"]), CategoryController.getParentCategories);
router.get("/admin/subcategories", auth, authorize(["ADMIN"]), CategoryController.getAllSubcategories);

// Protected Admin only management routes
router.post("/", auth, authorize(["ADMIN"]), uploadCategoryIcon, validateRequest(createCategorySchema), CategoryController.createCategory);

router.patch("/:id", auth, authorize(["ADMIN"]), uploadCategoryIcon, validateRequest(updateCategorySchema), CategoryController.updateCategory);

router.delete("/:id", auth, authorize(["ADMIN"]), CategoryController.deleteCategory);

export const CategoryRoutes = router;
