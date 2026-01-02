import React, { useState, useEffect, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
    FiBell,
    FiDownload,
    FiCheck,
    FiClock,
    FiAlertCircle,
    FiLoader,
    FiX,
} from "react-icons/fi";
import axios from "axios";

export default function NotificationDropdown() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setIsLoading(true);

            // Fetch both products and audit logs notifications in parallel
            const [productsResponse, auditLogsResponse] = await Promise.all([
                axios
                    .get(route("products.export-notifications"))
                    .catch(() => ({ data: { notifications: [] } })),
                axios
                    .get(route("audit-logs.export-notifications"))
                    .catch(() => ({ data: { notifications: [] } })),
            ]);

            // Combine notifications from both sources
            const allNotifications = [
                ...(productsResponse.data.notifications || []),
                ...(auditLogsResponse.data.notifications || []),
            ];

            // Sort by timestamp (newest first)
            allNotifications.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );

            setNotifications(allNotifications);

            // Count unread (pending or processing) notifications
            const unread = allNotifications.filter(
                (n) => n.status === "pending" || n.status === "processing"
            ).length;
            setUnreadCount(unread);
        } catch (error) {
            
        } finally {
            setIsLoading(false);
        }
    };

    // Smart polling - only when dropdown is open or there are active exports
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            // Only poll if dropdown is open OR there are active exports
            const hasActiveExports = notifications.some(
                (n) => n.status === "pending" || n.status === "processing"
            );

            if (isDropdownOpen || hasActiveExports) {
                fetchNotifications();
            }
        }, 30000); // Check every 30 seconds when needed

        return () => clearInterval(interval);
    }, [isDropdownOpen, notifications.length]); // Re-run when dropdown state or notification count changes

    // Handle download
    const handleDownload = (notification) => {
        if (notification.can_download) {
            let url;

            // Determine the correct download route based on the notification title
            if (notification.title.includes("Products Export")) {
                url = route("products.download-export", {
                    export_id: notification.id,
                });
            } else if (notification.title.includes("Audit Logs Export")) {
                url = route("audit-logs.download-export", {
                    export_id: notification.id,
                });
            } else {
                // Fallback to products for backward compatibility
                url = route("products.download-export", {
                    export_id: notification.id,
                });
            }

            window.location.href = url;
            // Refresh notifications after download
            setTimeout(fetchNotifications, 1000);
        }
    };

    // Handle dismiss notification
    const handleDismiss = async (notification, event) => {
        event.stopPropagation(); // Prevent download trigger

        try {
            let url;
            if (notification.title.includes("Products Export")) {
                url = route("products.dismiss-notification", notification.id);
            } else if (notification.title.includes("Audit Logs Export")) {
                url = route("audit-logs.dismiss-notification", notification.id);
            }

            await axios.post(url);

            // Remove notification from local state
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
            );

            // Update unread count
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            
        }
    };

    // Get status icon
    const getStatusIcon = (notification) => {
        switch (notification.status) {
            case "pending":
                return <FiClock className="w-4 h-4 text-yellow-500" />;
            case "processing":
                return (
                    <FiLoader className="w-4 h-4 text-blue-500 animate-spin" />
                );
            case "completed":
                return notification.can_download ? (
                    <FiDownload className="w-4 h-4 text-green-500" />
                ) : (
                    <FiCheck className="w-4 h-4 text-gray-500" />
                );
            case "failed":
                return <FiAlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <FiBell className="w-4 h-4 text-gray-500" />;
        }
    };

    // Get status color class
    const getStatusColorClass = (notification) => {
        switch (notification.status) {
            case "pending":
                return "border-l-yellow-500";
            case "processing":
                return "border-l-blue-500";
            case "completed":
                return notification.can_download
                    ? "border-l-green-500"
                    : "border-l-gray-400";
            case "failed":
                return "border-l-red-500";
            default:
                return "border-l-gray-300";
        }
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            {({ open }) => {
                // Update dropdown state when Menu state changes
                if (open !== isDropdownOpen) {
                    setIsDropdownOpen(open);
                    // Fetch immediately when dropdown opens
                    if (open) {
                        fetchNotifications();
                    }
                }

                return (
                    <>
                        <div>
                            <Menu.Button className="relative inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full">
                                <FiBell className="w-5 h-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px]">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </Menu.Button>
                        </div>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-96 overflow-y-auto">
                                <div className="py-1">
                                    <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
                                        <h3 className="text-sm font-medium text-gray-900 flex items-center justify-between">
                                            Export Notifications
                                            {isLoading && (
                                                <FiLoader className="w-4 h-4 animate-spin text-gray-500" />
                                            )}
                                        </h3>
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-500">
                                            <FiBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">
                                                No export notifications
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <Menu.Item key={notification.id}>
                                                {({ active }) => (
                                                    <div
                                                        className={`${
                                                            active
                                                                ? "bg-gray-50"
                                                                : ""
                                                        } px-4 py-3 border-l-4 ${getStatusColorClass(
                                                            notification
                                                        )} cursor-pointer`}
                                                        onClick={() =>
                                                            notification.can_download &&
                                                            handleDownload(
                                                                notification
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                {getStatusIcon(
                                                                    notification
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                                        {
                                                                            notification.title
                                                                        }
                                                                    </p>
                                                                    {notification.priority ===
                                                                        "high" && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                                                                            Priority
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {
                                                                        notification.message
                                                                    }
                                                                </p>
                                                                {notification.record_count >
                                                                    0 && (
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        {notification.record_count.toLocaleString()}{" "}
                                                                        records
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <p className="text-xs text-gray-400">
                                                                        {
                                                                            notification.time_ago
                                                                        }
                                                                    </p>
                                                                    {notification.status ===
                                                                        "processing" && (
                                                                        <div className="flex items-center space-x-2">
                                                                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                                <div
                                                                                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                                                                    style={{
                                                                                        width: `${notification.progress}%`,
                                                                                    }}
                                                                                ></div>
                                                                            </div>
                                                                            <span className="text-xs text-gray-500">
                                                                                {
                                                                                    notification.progress
                                                                                }

                                                                                %
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {notification.can_download && (
                                                                        <button className="inline-flex items-center text-xs text-green-600 hover:text-green-800 font-medium">
                                                                            <FiDownload className="w-3 h-3 mr-1" />
                                                                            Download
                                                                        </button>
                                                                    )}
                                                                    {notification.status ===
                                                                        "completed" && (
                                                                        <button
                                                                            onClick={(
                                                                                e
                                                                            ) =>
                                                                                handleDismiss(
                                                                                    notification,
                                                                                    e
                                                                                )
                                                                            }
                                                                            className="inline-flex items-center text-xs text-gray-400 hover:text-gray-600 font-medium ml-2"
                                                                            title="Dismiss notification"
                                                                        >
                                                                            <FiX className="w-3 h-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Menu.Item>
                                        ))
                                    )}

                                    {notifications.length > 0 && (
                                        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                                            <button
                                                onClick={fetchNotifications}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                Refresh notifications
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </Menu.Items>
                        </Transition>
                    </>
                );
            }}
        </Menu>
    );
}
