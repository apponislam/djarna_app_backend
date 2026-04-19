import { Router } from "express";
import { FavoriteController } from "./favorite.controllers";
import auth from "../../middlewares/auth";

const router = Router();

// Toggle favorite status
router.post("/toggle", auth, FavoriteController.toggleFavorite);

// Get my favorite products
router.get("/my-favorites", auth, FavoriteController.getMyFavorites);

export const FavoriteRoutes = router;
