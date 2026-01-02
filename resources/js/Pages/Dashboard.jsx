import React from "react";
import AdminLTELayout from "../Layouts/AdminLayout";
import { Head } from "@inertiajs/react";
import Breadcrumb from "@/Components/Breadcrumb";
import {
    FaShoppingBag,
    FaBox,
    FaUsers,
    FaDollarSign,
    FaCheck,
    FaTimes,
    FaChartLine,
    FaChartPie,
    FaApple,
    FaAndroid,
} from "react-icons/fa";

import { IoIosTrendingUp, IoIosTrendingDown } from "react-icons/io";
import { FiActivity } from "react-icons/fi";
import { HiOutlineDevicePhoneMobile } from "react-icons/hi2";
import { SiHuawei, SiSamsung } from "react-icons/si";
import { BsApple } from "react-icons/bs";

const Dashboard = ({
    stats = {},
    monthlyRevenue = [],
    orderStatus = {},
    brandStats = [],
    recentActivities = [],
    paymentStats = {},
}) => {
    const headWeb = "Dashboard";
    const linksBreadcrumb = [
        { title: "Home", url: "/" },
        { title: headWeb, url: "" },
    ];

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount || 0);
    };

    // Provide default values for stats
    const safeStats = {
        totalOrders: 0,
        ordersChange: 0,
        totalProducts: 0,
        productsChange: 0,
        totalUsers: 0,
        usersChange: 0,
        totalRevenue: 0,
        revenueChange: 0,
        ...stats,
    };

    // Provide default values for other props
    const safeMonthlyRevenue =
        monthlyRevenue.length > 0
            ? monthlyRevenue
            : [
                  { month: "Jan", revenue: 0 },
                  { month: "Feb", revenue: 0 },
                  { month: "Mar", revenue: 0 },
                  { month: "Apr", revenue: 0 },
                  { month: "May", revenue: 0 },
                  { month: "Jun", revenue: 0 },
              ];

    const safeOrderStatus = {
        completedPercentage: 0,
        ...orderStatus,
    };

    const safePaymentStats = {
        auditing: 0,
        completed: 0,
        rejected: 0,
        revenue: 0,
        ...paymentStats,
    };

    const safeBrandStats = brandStats.length > 0 ? brandStats : [];
    const safeRecentActivities =
        recentActivities.length > 0 ? recentActivities : [];

    // Dynamic stats with real data
    const dashboardStats = [
        {
            title: "Total Orders",
            value: safeStats.totalOrders.toLocaleString(),
            change: `${safeStats.ordersChange >= 0 ? "+" : ""}${
                safeStats.ordersChange
            }%`,
            changeType: safeStats.ordersChange >= 0 ? "increase" : "decrease",
            icon: <FaShoppingBag className="w-6 h-6" />,
            iconColor: "text-blue-600",
            iconBg: "bg-blue-100",
        },
        {
            title: "Total Products",
            value: safeStats.totalProducts.toLocaleString(),
            change: `${safeStats.productsChange >= 0 ? "+" : ""}${
                safeStats.productsChange
            }%`,
            changeType: safeStats.productsChange >= 0 ? "increase" : "decrease",
            icon: <HiOutlineDevicePhoneMobile className="w-6 h-6" />,
            iconColor: "text-emerald-600",
            iconBg: "bg-emerald-100",
        },
        {
            title: "Total Users",
            value: safeStats.totalUsers.toLocaleString(),
            change: `${safeStats.usersChange >= 0 ? "+" : ""}${
                safeStats.usersChange
            }%`,
            changeType: safeStats.usersChange >= 0 ? "increase" : "decrease",
            icon: <FaUsers className="w-6 h-6" />,
            iconColor: "text-amber-600",
            iconBg: "bg-amber-100",
        },
        {
            title: "Total Revenue",
            value: formatCurrency(safeStats.totalRevenue),
            change: `${safeStats.revenueChange >= 0 ? "+" : ""}${
                safeStats.revenueChange
            }%`,
            changeType: safeStats.revenueChange >= 0 ? "increase" : "decrease",
            icon: <FaDollarSign className="w-6 h-6" />,
            iconColor: "text-rose-500",
            iconBg: "bg-rose-100",
        },
    ];

    // Dynamic recent activities with real data
    const formattedActivities = safeRecentActivities.map((activity, index) => ({
        id: activity?.id
            ? `activity-${activity.id}`
            : `activity-${index}-${Date.now()}`,
        title: activity?.title || "Unknown Activity",
        description: activity?.description || "No description available",
        time: activity?.time || "Unknown time",
        status: activity?.status || "unknown",
        icon:
            activity?.type === "order" ? (
                <FaShoppingBag className="w-4 h-4" />
            ) : (
                <FaBox className="w-4 h-4" />
            ),
        iconColor:
            activity?.type === "order" ? "text-blue-600" : "text-emerald-600",
        iconBg: activity?.type === "order" ? "bg-blue-100" : "bg-emerald-100",
    }));

    // Get brand icons
    const getBrandIcon = (brandName) => {
        const name = brandName.toLowerCase();
        if (name.includes("apple") || name.includes("iphone")) {
            return <BsApple className="text-blue-500 text-2xl mr-3" />;
        } else if (name.includes("samsung")) {
            return <SiSamsung className="text-green-500 text-2xl mr-3" />;
        } else if (name.includes("huawei")) {
            return <SiHuawei className="text-purple-500 text-2xl mr-3" />;
        } else {
            return (
                <HiOutlineDevicePhoneMobile className="text-gray-500 text-2xl mr-3" />
            );
        }
    };

    const getBrandColors = (brandName) => {
        const name = brandName.toLowerCase();
        if (name.includes("apple") || name.includes("iphone")) {
            return {
                bg: "bg-blue-50",
                border: "border-blue-100",
                text: "text-blue-600",
                progress: "bg-blue-500",
                progressBg: "bg-blue-100",
            };
        } else if (name.includes("samsung")) {
            return {
                bg: "bg-green-50",
                border: "border-green-100",
                text: "text-green-600",
                progress: "bg-green-500",
                progressBg: "bg-green-100",
            };
        } else if (name.includes("huawei")) {
            return {
                bg: "bg-purple-50",
                border: "border-purple-100",
                text: "text-purple-600",
                progress: "bg-purple-500",
                progressBg: "bg-purple-100",
            };
        } else {
            return {
                bg: "bg-gray-50",
                border: "border-gray-100",
                text: "text-gray-600",
                progress: "bg-gray-500",
                progressBg: "bg-gray-100",
            };
        }
    };

    return (
        <AdminLTELayout
            breadcrumb={<Breadcrumb header={headWeb} links={linksBreadcrumb} />}
        >
            <Head title={headWeb} />

            <div className="min-h-screen bg-gray-50">
                <div className="p-6">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <FaChartPie className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Welcome back!
                                    </h1>
                                    <p className="text-gray-600 mt-1">
                                        Here's what's happening with your
                                        business today.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {dashboardStats.map((stat, index) => (
                            <div
                                key={`dashboard-stat-${index}`}
                                className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                                    >
                                        <div className={stat.iconColor}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                                stat.changeType === "increase"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                        >
                                            {stat.changeType === "increase" ? (
                                                <IoIosTrendingUp className="w-3 h-3 mr-1" />
                                            ) : (
                                                <IoIosTrendingDown className="w-3 h-3 mr-1" />
                                            )}
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {stat.value}
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600">
                                        {stat.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Side - Payment Records (2/3 width) */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Payment Record
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Monthly revenue analytics
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        <IoIosTrendingUp className="mr-1" /> 12%
                                        from last month
                                    </span>
                                </div>
                            </div>

                            {/* Modern Chart Area */}
                            <div className="h-72 mb-8 relative">
                                {/* Y-axis */}
                                <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between items-end pr-2">
                                    {(() => {
                                        const maxRevenue = Math.max(
                                            ...safeMonthlyRevenue.map(
                                                (m) => m.revenue || 0
                                            )
                                        );
                                        const step =
                                            Math.ceil(maxRevenue / 7000) * 1000; // Round to nearest 1000
                                        const yAxisValues = [];
                                        for (let i = 7; i >= 0; i--) {
                                            yAxisValues.push(
                                                Math.round((step * i) / 1000)
                                            );
                                        }
                                        return yAxisValues.map(
                                            (value, index) => (
                                                <span
                                                    key={`y-axis-${index}-${value}`}
                                                    className="text-xs text-gray-400 font-medium"
                                                >
                                                    {value}K
                                                </span>
                                            )
                                        );
                                    })()}
                                </div>

                                {/* Chart Container */}
                                <div className="absolute left-10 right-0 top-0 bottom-0">
                                    {/* Grid Lines */}
                                    <div className="h-full w-full flex flex-col justify-between">
                                        {[...Array(7)].map((_, i) => (
                                            <div
                                                key={`grid-line-${i}`}
                                                className="border-t border-gray-100"
                                            ></div>
                                        ))}
                                    </div>

                                    {/* Chart Bars */}
                                    <div className="absolute inset-0 flex items-end justify-between px-2">
                                        {safeMonthlyRevenue.map(
                                            (monthData, i) => {
                                                const maxRevenue = Math.max(
                                                    ...safeMonthlyRevenue.map(
                                                        (m) => m.revenue || 0
                                                    )
                                                );
                                                const height =
                                                    maxRevenue > 0
                                                        ? ((monthData.revenue ||
                                                              0) /
                                                              maxRevenue) *
                                                          100
                                                        : 0;
                                                return (
                                                    <div
                                                        key={`${monthData.month}-${monthData.year}`}
                                                        className="flex flex-col items-center w-4 group"
                                                    >
                                                        <div
                                                            className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-md transition-all duration-300 group-hover:opacity-80"
                                                            style={{
                                                                height: `${Math.max(
                                                                    height,
                                                                    5
                                                                )}%`,
                                                            }}
                                                            title={`${
                                                                monthData.month
                                                            } ${
                                                                monthData.year
                                                            }: $${monthData.revenue.toLocaleString()}`}
                                                        ></div>
                                                        <span className="text-xs text-gray-500 mt-2 rotate-45 origin-left whitespace-nowrap">
                                                            {monthData.month}
                                                            {monthData.year}
                                                        </span>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards - Modern Design */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-100 transition duration-200 hover:shadow-md cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-blue-600">
                                            Auditing
                                        </span>
                                        <div className="w-8 h-8 rounded-lg bg-blue-200 bg-opacity-50 flex items-center justify-center">
                                            <FiActivity className="text-blue-600 text-sm" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(
                                            safePaymentStats.auditing
                                        )}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-100 transition duration-200 hover:shadow-md cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-green-600">
                                            Completed
                                        </span>
                                        <div className="w-8 h-8 rounded-lg bg-green-200 bg-opacity-50 flex items-center justify-center">
                                            <FaCheck className="text-green-600 text-sm" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(
                                            safePaymentStats.completed
                                        )}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-100 transition duration-200 hover:shadow-md cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-red-600">
                                            Rejected
                                        </span>
                                        <div className="w-8 h-8 rounded-lg bg-red-200 bg-opacity-50 flex items-center justify-center">
                                            <FaTimes className="text-red-600 text-sm" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(
                                            safePaymentStats.rejected
                                        )}
                                    </p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-100 transition duration-200 hover:shadow-md cursor-pointer">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-purple-600">
                                            Revenue
                                        </span>
                                        <div className="w-8 h-8 rounded-lg bg-purple-200 bg-opacity-50 flex items-center justify-center">
                                            <FaDollarSign className="text-purple-600 text-sm" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(
                                            safePaymentStats.revenue
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Order Status (1/3 width) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Order Status
                            </h2>

                            {/* Circular Progress */}
                            <div className="flex justify-center mb-8">
                                <div className="relative w-40 h-40">
                                    <svg
                                        className="w-full h-full"
                                        viewBox="0 0 36 36"
                                    >
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="15.9155"
                                            className="text-gray-200"
                                            strokeWidth="2"
                                            stroke="currentColor"
                                            fill="none"
                                        />
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="15.9155"
                                            className="text-blue-500"
                                            strokeWidth="2"
                                            strokeDasharray={`${safeOrderStatus.completedPercentage}, 100`}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="none"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-3xl font-bold text-gray-900">
                                            {
                                                safeOrderStatus.completedPercentage
                                            }
                                            %
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            Completed
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Brand Stats Cards */}
                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                {safeBrandStats.map((brand, index) => {
                                    const colors = getBrandColors(
                                        brand?.name || "unknown"
                                    );
                                    return (
                                        <div
                                            key={`brand-stat-${index}`}
                                            className={`${colors.bg} p-4 rounded-lg border ${colors.border} hover:shadow-md transition-shadow cursor-pointer`}
                                        >
                                            <div className="flex items-center">
                                                {getBrandIcon(
                                                    brand?.name || "unknown"
                                                )}
                                                <div className="flex-1">
                                                    <p
                                                        className={`font-semibold ${colors.text}`}
                                                    >
                                                        {(
                                                            brand?.name ||
                                                            "Unknown"
                                                        ).toUpperCase()}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {brand?.count || 0}{" "}
                                                        Items
                                                    </p>
                                                </div>
                                                <span className="text-xl font-bold text-gray-900">
                                                    {Math.round(
                                                        brand?.percentage || 0
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                            <div
                                                className={`w-full ${colors.progressBg} rounded-full h-2 mt-2`}
                                            >
                                                <div
                                                    className={`${colors.progress} h-2 rounded-full`}
                                                    style={{
                                                        width: `${
                                                            brand?.percentage ||
                                                            0
                                                        }%`,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Show message if no brand data */}
                                {safeBrandStats.length === 0 && (
                                    <div className="text-center py-8">
                                        <p className="text-gray-500">
                                            No brand data available
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-8 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Recent Activity
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Latest system activities and events
                                </p>
                            </div>
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                View All
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Activity
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Details
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Status
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Time
                                        </th>
                                        <th
                                            scope="col"
                                            className="relative px-6 py-3"
                                        >
                                            <span className="sr-only">
                                                Actions
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {formattedActivities.map((activity) => (
                                        <tr
                                            key={activity.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div
                                                        className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${activity.iconBg}`}
                                                    >
                                                        <div
                                                            className={
                                                                activity.iconColor
                                                            }
                                                        >
                                                            {activity.icon}
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {activity.title}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {activity.description}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                    ${
                                                        activity.status ===
                                                        "completed"
                                                            ? "bg-green-100 text-green-800"
                                                            : activity.status ===
                                                              "pending"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {activity.status ===
                                                    "completed"
                                                        ? "Completed"
                                                        : activity.status ===
                                                          "pending"
                                                        ? "Pending"
                                                        : "Alert"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {activity.time}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button className="text-blue-600 hover:text-blue-900 mr-3">
                                                    View
                                                </button>
                                                <button className="text-gray-600 hover:text-gray-900">
                                                    Dismiss
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Show message if no activities */}
                                    {formattedActivities.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="px-6 py-4 text-center text-gray-500"
                                            >
                                                No recent activities found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Showing <span className="font-medium">1</span>{" "}
                                to{" "}
                                <span className="font-medium">
                                    {Math.min(formattedActivities.length, 10)}
                                </span>{" "}
                                of{" "}
                                <span className="font-medium">
                                    {formattedActivities.length}
                                </span>{" "}
                                activities
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    disabled
                                >
                                    Previous
                                </button>
                                <button
                                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                    disabled={formattedActivities.length <= 10}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLTELayout>
    );
};

export default Dashboard;
