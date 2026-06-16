import { Router } from "express";
import { Category2Controller } from "./category2.controllers";
import validateRequest from "../../middlewares/validateRequest";
import { createCategory2Schema, updateCategory2Schema } from "./category2.validations";
import auth from "../../middlewares/auth";
import authorize from "../../middlewares/authorized";
import { parseBodyData, uploadCategoryIcon } from "../../middlewares/multer";

const router = Router();

// Public routes
router.get("/tree", Category2Controller.getCategoryTree);
router.get("/level/:level", Category2Controller.getCategoriesByLevel);
router.get("/parents", Category2Controller.getParentCategories);
router.get("/subcategories/:parentId", Category2Controller.getSubcategoriesByParent);
router.get("/:id", Category2Controller.getCategoryById);

// Admin Dashboard Routes
router.get("/admin/parents", auth, authorize(["ADMIN"]), Category2Controller.getParentCategories);
router.get("/admin/subcategories", auth, authorize(["ADMIN"]), Category2Controller.getAllSubcategories);
router.get("/admin/tree", auth, authorize(["ADMIN"]), Category2Controller.getCategoryTree);

// Protected Admin only management routes
router.post(
    "/",
    auth,
    authorize(["ADMIN"]),
    uploadCategoryIcon,
    parseBodyData,
    validateRequest(createCategory2Schema),
    Category2Controller.createCategory,
);

router.patch(
    "/:id",
    auth,
    authorize(["ADMIN"]),
    uploadCategoryIcon,
    parseBodyData,
    validateRequest(updateCategory2Schema),
    Category2Controller.updateCategory,
);

router.delete("/:id", auth, authorize(["ADMIN"]), Category2Controller.deleteCategory);

export const Category2Routes = router;
