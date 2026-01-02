import React, { useState, useEffect } from "react";
import { useForm, router, usePage, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import InputError from "@/Components/InputError";
import {
    FiMessageSquare,
    FiShoppingCart,
    FiCheck,
    FiExternalLink,
    FiCheckCircle,
    FiAlertCircle,
    FiWifi,
} from "react-icons/fi";

export default function VerifyKey() {
    const { flash } = usePage().props;
    const [activeTab, setActiveTab] = useState("auth");
    const [showSuccess, setShowSuccess] = useState(false);

    // Debug: Always log when component mounts and flash data
    console.log("VerifyKey component loaded");
    console.log("Flash data:", flash);

    const authForm = useForm({
        key: "",
    });

    const orderForm = useForm({
        key: "",
    });

    // Clear form inputs when success flash message is received and trigger animation
    useEffect(() => {
        // Debug logging
        if (flash.success) {
            console.log("Flash success received:", flash.success);
        }

        if (
            flash.success === "auth-linked" ||
            flash.success === "auth-updated" ||
            flash.success === "auth-invalid"
        ) {
            console.log("Clearing auth form and showing success");
            authForm.setData("key", "");
            setShowSuccess(true);
            // Reset animation state after 5 seconds
            setTimeout(() => setShowSuccess(false), 5000);
        }
        if (
            flash.success === "order-linked" ||
            flash.success === "order-updated" ||
            flash.success === "order-invalid"
        ) {
            console.log("Clearing order form and showing success");
            orderForm.setData("key", "");
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        }
    }, [flash.success]);

    const handleAuthSubmit = (e) => {
        e.preventDefault();
        console.log("=== AUTH SUBMIT CLICKED ===");
        console.log("Current auth form data:", authForm.data);
        console.log("Auth form key value:", authForm.data.key);

        authForm.post("/telegram/verify-auth", {
            onStart: () => {
                console.log("Auth request started");
            },
            onSuccess: (page) => {
                console.log("Auth verification request completed successfully");
                console.log("Response page:", page);
            },
            onError: (errors) => {
                console.log("Auth verification request failed");
                console.log("Errors:", errors);
            },
            onFinish: () => {
                console.log("Auth request finished");
            },
        });
    };

    const handleOrderSubmit = (e) => {
        e.preventDefault();
        console.log("Order form submitted, posting to /telegram/verify-order");
        orderForm.post("/telegram/verify-order", {
            onSuccess: () => {
                console.log(
                    "Order verification request completed successfully"
                );
            },
            onError: () => {
                console.log("Order verification request failed");
            },
        });
    };

    const headWeb = "Verify Telegram Bots";
    const linksBreadcrumb = [
        { title: "Home", url: "/" },
        { title: headWeb, url: "" },
    ];

    return (
        <AdminLayout
            breadcrumb={<Breadcrumb header={headWeb} links={linksBreadcrumb} />}
        >
            <Head title={headWeb} />

            <div className="w-full h-screen bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-200 flex flex-col">
                {/* Top border accent with gradient */}
                <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-700" />

                {/* Header section */}
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex items-center space-x-4"></div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <nav className="flex space-x-8 px-8" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab("auth")}
                            className={`flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                                activeTab === "auth"
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                        >
                            <FiMessageSquare className="w-4 h-4" />
                            <span>User Bot Verification</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("order")}
                            className={`flex items-center space-x-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                                activeTab === "order"
                                    ? "border-green-500 text-green-600 dark:text-green-400"
                                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                            }`}
                        >
                            <FiShoppingCart className="w-4 h-4" />
                            <span>Order Bot Verification</span>
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Auth Bot Tab Content */}
                    {activeTab === "auth" && (
                        <form
                            onSubmit={handleAuthSubmit}
                            className="px-8 py-8 space-y-8"
                        >
                            {/* Header with Icon */}
                            <div className="flex items-start space-x-4">
                                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                                    <FiMessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        User Bot Verification
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Verify your authentication with the
                                        Telegram auth bot to enable secure login
                                        features and user authentication.
                                    </p>
                                </div>
                            </div>

                            {/* Input Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="auth-key"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    User Bot Key{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="auth-key"
                                    name="key"
                                    value={authForm.data.key}
                                    onChange={(e) =>
                                        authForm.setData("key", e.target.value)
                                    }
                                    placeholder={
                                        authForm.processing
                                            ? "Verifying..."
                                            : "Enter your Auth Bot verification key"
                                    }
                                    disabled={authForm.processing}
                                    className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                        focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                        ${
                                            authForm.errors.key
                                                ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                                : flash.success ===
                                                      "auth-linked" ||
                                                  flash.success ===
                                                      "auth-updated"
                                                ? "border-green-500 dark:border-green-400 focus:ring-green-200 dark:focus:ring-green-900/30"
                                                : ""
                                        }
                                        ${
                                            authForm.processing
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }
                                        transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                />
                                <InputError
                                    message={authForm.errors.key}
                                    className="mt-1"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-2">
                                    <a
                                        href="https://t.me/JGBAN_UserBot"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                                    >
                                        <FiExternalLink className="w-4 h-4" />
                                        <span>Open User Bot</span>
                                    </a>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        type="submit"
                                        disabled={authForm.processing}
                                        className={`inline-flex items-center space-x-2 px-6 py-2 text-white rounded-xl focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg ${
                                            flash.success === "auth-linked" ||
                                            flash.success === "auth-updated"
                                                ? "bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus:ring-green-200 dark:focus:ring-green-900/30"
                                                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:ring-blue-200 dark:focus:ring-blue-900/30"
                                        }`}
                                    >
                                        {flash.success === "auth-linked" ||
                                        flash.success === "auth-updated" ? (
                                            <FiCheckCircle className="w-4 h-4" />
                                        ) : (
                                            <FiCheck className="w-4 h-4" />
                                        )}
                                        <span>
                                            {authForm.processing
                                                ? "Verifying..."
                                                : flash.success ===
                                                      "auth-linked" ||
                                                  flash.success ===
                                                      "auth-updated"
                                                ? "Successfully Verified!"
                                                : "Verify User Bot"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Enhanced Flash Messages */}
                            <div className="space-y-4">
                                {flash.success === "auth-linked" && (
                                    <div
                                        className={`p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl shadow-lg transform transition-all duration-500 ${
                                            showSuccess
                                                ? "animate-pulse scale-105"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full animate-bounce">
                                                <FiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
                                                    🎉 Authentication Bot
                                                    Successfully Linked!
                                                </h4>
                                                <p className="text-green-700 dark:text-green-400 mb-3">
                                                    Your Telegram account has
                                                    been successfully connected
                                                    to your admin dashboard. You
                                                    can now use secure Telegram
                                                    authentication features.
                                                </p>

                                                {flash.telegram_info && (
                                                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg mb-3">
                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                            <div>
                                                                <span className="font-medium text-green-800 dark:text-green-300">
                                                                    Username:
                                                                </span>
                                                                <span className="ml-2 text-green-700 dark:text-green-400">
                                                                    @
                                                                    {
                                                                        flash
                                                                            .telegram_info
                                                                            .username
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-green-800 dark:text-green-300">
                                                                    Linked at:
                                                                </span>
                                                                <span className="ml-2 text-green-700 dark:text-green-400">
                                                                    {
                                                                        flash
                                                                            .telegram_info
                                                                            .linked_at
                                                                    }
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-4 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <FiWifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                                            Webhook Active
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                        <span className="text-green-600 dark:text-green-400 font-medium">
                                                            Authentication
                                                            Enabled
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {flash.success === "auth-updated" && (
                                    <div
                                        className={`p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-lg transform transition-all duration-500 ${
                                            showSuccess
                                                ? "animate-pulse scale-105"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                                                <FiCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
                                                    ✅ Authentication Settings
                                                    Updated
                                                </h4>
                                                <p className="text-blue-700 dark:text-blue-400 mb-3">
                                                    Your User Bot configuration
                                                    has been successfully
                                                    updated. All authentication
                                                    features are working
                                                    perfectly.
                                                </p>
                                                <div className="flex items-center space-x-4 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <FiCheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                            Configuration Saved
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {flash.success === "auth-invalid" && (
                                    <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl shadow-lg">
                                        <div className="flex items-start space-x-4">
                                            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
                                                <FiAlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">
                                                    ⚠️ Invalid Authentication
                                                    Key
                                                </h4>
                                                <p className="text-amber-700 dark:text-amber-400 mb-3">
                                                    The User Bot key you entered
                                                    was not found or is already
                                                    in use by another account.
                                                    Please check your key and
                                                    try again.
                                                </p>
                                                <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg mt-3">
                                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                                        <strong>
                                                            Need help?
                                                        </strong>{" "}
                                                        Go to your Telegram bot
                                                        (@JGBAN_UserBot) and
                                                        send
                                                        <code className="bg-amber-200 dark:bg-amber-800 px-1 rounded mx-1">
                                                            /generate_key
                                                        </code>
                                                        to get a new
                                                        verification key.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    )}

                    {/* Order Bot Tab Content */}
                    {activeTab === "order" && (
                        <form
                            onSubmit={handleOrderSubmit}
                            className="px-8 py-8 space-y-8"
                        >
                            {/* Header with Icon */}
                            <div className="flex items-start space-x-4">
                                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                                    <FiShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                        Order Bot Verification
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                        Verify your connection with the Order
                                        Telegram bot to receive real-time order
                                        notifications and updates.
                                    </p>
                                </div>
                            </div>

                            {/* Input Field */}
                            <div className="space-y-2">
                                <label
                                    htmlFor="order-key"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                    Order Bot Key{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="order-key"
                                    name="key"
                                    value={orderForm.data.key}
                                    onChange={(e) =>
                                        orderForm.setData("key", e.target.value)
                                    }
                                    placeholder="Enter your Order Bot verification key"
                                    className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                        focus:border-green-500 dark:focus:border-green-400 focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/30 
                                        ${
                                            orderForm.errors.key
                                                ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                                : ""
                                        }
                                        transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                />
                                <InputError
                                    message={orderForm.errors.key}
                                    className="mt-1"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-2">
                                    <a
                                        href="https://t.me/Smart_POS_Bot"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors duration-200"
                                    >
                                        <FiExternalLink className="w-4 h-4" />
                                        <span>Open Order Bot</span>
                                    </a>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        type="submit"
                                        disabled={orderForm.processing}
                                        className="inline-flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-xl focus:outline-none focus:ring-4 focus:ring-green-200 dark:focus:ring-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
                                    >
                                        <FiCheck className="w-4 h-4" />
                                        <span>
                                            {orderForm.processing
                                                ? "Verifying..."
                                                : "Verify Order Bot"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Flash Messages */}
                            <div className="space-y-3">
                                {flash.success === "order-linked" && (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                        <div className="flex items-center space-x-2">
                                            <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <p className="text-green-800 dark:text-green-300 font-medium">
                                                Order Bot key has been linked
                                                with account successfully.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {flash.success === "order-updated" && (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                                        <div className="flex items-center space-x-2">
                                            <FiCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            <p className="text-green-800 dark:text-green-300 font-medium">
                                                Order Bot key saved to your
                                                account.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {flash.success === "order-invalid" && (
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                                        <div className="flex items-center space-x-2">
                                            <FiShoppingCart className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                            <p className="text-yellow-800 dark:text-yellow-300 font-medium">
                                                Order Bot key not found. Invalid
                                                Telegram auth.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
