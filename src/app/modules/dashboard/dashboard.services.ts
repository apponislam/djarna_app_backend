import { OrderModel } from "../order/order.model";
import { ProductModel } from "../product/product.model";
import { UserModel } from "../auth/auth.model";
import { PaymentModel } from "../payment/payment.model";
import { BoostPaymentModel } from "../boostPayment/boostPayment.model";

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

const getCommissionStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const totalCommission = await PaymentModel.aggregate([
        {
            $match: {
                status: "COMPLETED",
                siteFee: { $exists: true },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$siteFee" },
            },
        },
    ]);

    const thisMonthCommission = await PaymentModel.aggregate([
        {
            $match: {
                status: "COMPLETED",
                siteFee: { $exists: true },
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$siteFee" },
            },
        },
    ]);

    const pendingEscrow = await PaymentModel.aggregate([
        {
            $match: {
                escrow: true,
                status: "COMPLETED",
                escrowReleasedAt: { $exists: false },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$productPrice" },
            },
        },
    ]);

    const totalBoost = await BoostPaymentModel.aggregate([
        {
            $match: {
                status: "COMPLETED",
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
            },
        },
    ]);

    const thisMonthBoost = await BoostPaymentModel.aggregate([
        {
            $match: {
                status: "COMPLETED",
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
            },
        },
    ]);

    const totalBuyerProtection = await PaymentModel.aggregate([
        {
            $match: {
                status: "COMPLETED",
                buyerProtectionFee: { $exists: true },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$buyerProtectionFee" },
            },
        },
    ]);

    const thisMonthBuyerProtection = await PaymentModel.aggregate([
        {
            $match: {
                status: "COMPLETED",
                buyerProtectionFee: { $exists: true },
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$buyerProtectionFee" },
            },
        },
    ]);

    const totalCommissionVal = totalCommission.length > 0 ? totalCommission[0].total : 0;
    const thisMonthCommissionVal = thisMonthCommission.length > 0 ? thisMonthCommission[0].total : 0;
    const pendingEscrowVal = pendingEscrow.length > 0 ? pendingEscrow[0].total : 0;
    const totalBoostVal = totalBoost.length > 0 ? totalBoost[0].total : 0;
    const thisMonthBoostVal = thisMonthBoost.length > 0 ? thisMonthBoost[0].total : 0;
    const totalBuyerProtectionVal = totalBuyerProtection.length > 0 ? totalBuyerProtection[0].total : 0;
    const thisMonthBuyerProtectionVal = thisMonthBuyerProtection.length > 0 ? thisMonthBuyerProtection[0].total : 0;

    const totalRevenueVal = totalCommissionVal + totalBoostVal + totalBuyerProtectionVal;
    const thisMonthRevenueVal = thisMonthCommissionVal + thisMonthBoostVal + thisMonthBuyerProtectionVal;

    return {
        totalRevenue: totalRevenueVal,
        thisMonthRevenue: thisMonthRevenueVal,
        totalCommission: totalCommissionVal,
        thisMonthCommission: thisMonthCommissionVal,
        totalBoost: totalBoostVal,
        thisMonthBoost: thisMonthBoostVal,
        totalBuyerProtectionFee: totalBuyerProtectionVal,
        thisMonthBuyerProtectionFee: thisMonthBuyerProtectionVal,
        pendingEscrow: pendingEscrowVal,
    };
};

const getThisMonthStats = async () => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthOrders = await OrderModel.countDocuments({
        createdAt: { $gte: startOfThisMonth, $lte: endOfThisMonth },
        isDeleted: false,
    });

    const thisMonthCommission = await PaymentModel.aggregate([
        {
            $match: {
                status: "COMPLETED",
                siteFee: { $exists: true },
                createdAt: { $gte: startOfThisMonth, $lte: endOfThisMonth },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$siteFee" },
            },
        },
    ]);

    const lastMonthCommission = await PaymentModel.aggregate([
        {
            $match: {
                status: "COMPLETED",
                siteFee: { $exists: true },
                createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$siteFee" },
            },
        },
    ]);

    const currentCommission = thisMonthCommission.length > 0 ? thisMonthCommission[0].total : 0;
    const lastCommission = lastMonthCommission.length > 0 ? lastMonthCommission[0].total : 0;
    const averagePerOrder = thisMonthOrders > 0 ? Math.round(currentCommission / thisMonthOrders) : 0;
    let growth = 0;
    if (lastCommission > 0) {
        growth = ((currentCommission - lastCommission) / lastCommission) * 100;
    } else if (currentCommission > 0) {
        growth = 100;
    }

    return {
        totalOrders: thisMonthOrders,
        commissionEarned: currentCommission,
        averagePerOrder: averagePerOrder,
        growthVsLastMonth: parseFloat(growth.toFixed(1)),
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
    getCommissionStats,
    getThisMonthStats,
};
