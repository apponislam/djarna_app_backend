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

const getRevenueChartData = async () => {
    const data = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        const dailyRevenue = await OrderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: date, $lt: nextDay },
                    isDeleted: false,
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalAmount" },
                },
            },
        ]);

        const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });

        data.push({
            date: formattedDate,
            revenue: dailyRevenue.length > 0 ? dailyRevenue[0].total : 0,
        });
    }

    return data;
};

const getCategoryPerformance = async () => {
    const performance = await ProductModel.aggregate([
        {
            $match: { isDeleted: false },
        },
        {
            $group: {
                _id: "$category",
                value: { $sum: 1 },
            },
        },
        {
            $project: {
                name: "$_id",
                value: 1,
                _id: 0,
            },
        },
        {
            $sort: { value: -1 },
        },
        {
            $limit: 5,
        },
    ]);

    // Define colors for categories
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#06b6d4"];

    return performance.map((item, index) => ({
        ...item,
        color: colors[index % colors.length],
    }));
};

export const DashboardServices = {
    getDashboardStats,
    getOrdersChartData,
    getRevenueChartData,
    getCategoryPerformance,
};
