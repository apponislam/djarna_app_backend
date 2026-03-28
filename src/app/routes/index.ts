import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { CategoryRoutes } from "../modules/category/category.routes";
import { ProductRoutes } from "../modules/product/product.routes";
import { ReportRoutes } from "../modules/report/report.routes";
import { BoostPackRoutes } from "../modules/boostPack/boostPack.routes";
import { SettingsRoutes } from "../modules/settings/settings.routes";
import { FollowRoutes } from "../modules/follow/follow.routes";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: authRoutes,
    },
    {
        path: "/category",
        route: CategoryRoutes,
    },
    {
        path: "/product",
        route: ProductRoutes,
    },
    {
        path: "/report",
        route: ReportRoutes,
    },
    {
        path: "/boost-pack",
        route: BoostPackRoutes,
    },
    {
        path: "/settings",
        route: SettingsRoutes,
    },
    {
        path: "/follow",
        route: FollowRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
