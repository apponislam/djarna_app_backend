import express from "express";
import { authRoutes } from "../modules/auth/auth.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { CategoryRoutes } from "../modules/category/category.routes";
import { ProductRoutes } from "../modules/product/product.routes";
import { ReportRoutes } from "../modules/report/report.routes";
import { BoostPackRoutes } from "../modules/boostPack/boostPack.routes";
import { SettingsRoutes } from "../modules/settings/settings.routes";
import { FollowRoutes } from "../modules/follow/follow.routes";
import { FavoriteRoutes } from "../modules/favorite/favorite.routes";
import { PaymentRoutes } from "../modules/payment/payment.routes";
import { messageRoutes } from "../modules/message/messages.routes";
import { ReviewRoutes } from "../modules/review/review.routes";
import { BoostPaymentRoutes } from "../modules/boostPayment/boostPayment.routes";
import { IdentityVerificationRoutes } from "../modules/identityVerification/identityVerification.routes";
import { ShippingAddressRoutes } from "../modules/address/address.routes";
import { OrderRoutes } from "../modules/order/order.routes";
import { WithdrawRoutes } from "../modules/withdraw/withdraw.routes";

const router = express.Router();

const moduleRoutes = [
    {
        path: "/auth",
        route: authRoutes,
    },
    {
        path: "/user",
        route: UserRoutes,
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
        path: "/boost-payment",
        route: BoostPaymentRoutes,
    },
    {
        path: "/settings",
        route: SettingsRoutes,
    },
    {
        path: "/follow",
        route: FollowRoutes,
    },
    {
        path: "/favorite",
        route: FavoriteRoutes,
    },
    {
        path: "/payment",
        route: PaymentRoutes,
    },
    {
        path: "/messages",
        route: messageRoutes,
    },
    {
        path: "/review",
        route: ReviewRoutes,
    },
    {
        path: "/identity-verification",
        route: IdentityVerificationRoutes,
    },
    {
        path: "/address",
        route: ShippingAddressRoutes,
    },
    {
        path: "/order",
        route: OrderRoutes,
    },
    {
        path: "/withdraw",
        route: WithdrawRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
