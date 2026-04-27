import { OrderModel } from "../order/order.model";
import { ProductModel } from "../product/product.model";
import { UserModel } from "../auth/auth.model";

const getDashboardStats = async () => {
    const totalUsers = await UserModel.countDocuments();
    const activeListings = await ProductModel.countDocuments({
        status: "ACTIVE",
        isDeleted: false,
    });
    const ordersInProgress = await OrderModel.countDocuments({
        status: { $nin: ["DELIVERED", "CANCELLED", "COMPLETED"] },
        isDeleted: false,
    });
    const productBoosted = await ProductModel.countDocuments({
        isBoosted: true,
        status: "ACTIVE",
        isDeleted: false,
    });

    return {
        totalUsers,
        activeListings,
        ordersInProgress,
        productBoosted,
    };
};

const getOrdersChartData = async () => {
    const data = [];
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - i * 7);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const totalOrders = await OrderModel.countDocuments({
            createdAt: { $gte: startOfWeek, $lt: endOfWeek },
            isDeleted: false,
        });

        const completedOrders = await OrderModel.countDocuments({
            createdAt: { $gte: startOfWeek, $lt: endOfWeek },
            status: "COMPLETED",
            isDeleted: false,
        });

        data.push({
            week: `Week ${4 - i}`,
            orders: totalOrders,
            completed: completedOrders,
        });
    }

    return data;
};

export const DashboardServices = {
    getDashboardStats,
    getOrdersChartData,
};
