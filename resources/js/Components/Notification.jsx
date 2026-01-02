import React, {
    useState,
    useEffect,
    Fragment,
    useRef,
    useCallback,
} from "react";
import { Menu, Transition } from "@headlessui/react";
import {
    FiBell,
    FiDownload,
    FiCheck,
    FiClock,
    FiAlertCircle,
    FiLoader,
    FiX,
    FiShoppingCart,
    FiFileText,
    FiPackage,
    FiTrendingUp,
} from "react-icons/fi";
import { FaWifi } from "react-icons/fa";
import { MdSignalWifiOff } from "react-icons/md";
import axios from "axios";

export default function Notification() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const orderChannelRef = useRef(null);
    const productChannelRef = useRef(null);

    // Global debounce mechanism for preventing duplicates across browser tabs
    const recentNotificationsRef = useRef(new Set());

    // Cross-tab duplicate prevention using localStorage
    const addToGlobalCache = (key) => {
        try {
            const cache = JSON.parse(
                localStorage.getItem("notification_cache") || "{}"
            );
            cache[key] = Date.now();
            localStorage.setItem("notification_cache", JSON.stringify(cache));

            // Clean up old entries (older than 30 seconds)
            const now = Date.now();
            Object.keys(cache).forEach((k) => {
                if (now - cache[k] > 30000) {
                    delete cache[k];
                }
            });
            localStorage.setItem("notification_cache", JSON.stringify(cache));
        } catch (e) {
            // Failed to update notification cache - silent fail in production
        }
    };

    const isInGlobalCache = (key) => {
        try {
            const cache = JSON.parse(
                localStorage.getItem("notification_cache") || "{}"
            );
            const timestamp = cache[key];
            if (timestamp && Date.now() - timestamp < 30000) {
                return true;
            }
        } catch (e) {
            // Failed to check notification cache - silent fail in production
        }
        return false;
    };

    // Get order notifications from localStorage
    const getOrderNotifications = () => {
        try {
            const stored = localStorage.getItem("orderNotifications");
            return stored
                ? JSON.parse(stored).map((notification) => ({
                      ...notification,
                      type: "order",
                      category: "Order",
                  }))
                : [];
        } catch (error) {
            // Error parsing order notifications - return empty array
            return [];
        }
    };

    // Save order notifications to localStorage
    const saveOrderNotifications = (notifications) => {
        try {
            const orderNotifications = notifications.filter(
                (n) => n.type === "order"
            );

            // Clean up old notifications (older than 5 minutes) to prevent localStorage bloat
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const recentNotifications = orderNotifications.filter(
                (notification) => {
                    const notificationTime = new Date(
                        notification.timestamp || notification.created_at
                    ).getTime();
                    return notificationTime > fiveMinutesAgo;
                }
            );

            localStorage.setItem(
                "orderNotifications",
                JSON.stringify(recentNotifications)
            );
        } catch (error) {
            // Error saving order notifications - silent fail in production
        }
    };

    // Get product notifications from localStorage
    const getProductNotifications = () => {
        try {
            const stored = localStorage.getItem("productNotifications");
            return stored
                ? JSON.parse(stored).map((notification) => ({
                      ...notification,
                      type: "product",
                      category: "Product",
                  }))
                : [];
        } catch (error) {
            // Error parsing product notifications - return empty array
            return [];
        }
    };

    // Save product notifications to localStorage
    const saveProductNotifications = (notifications) => {
        try {
            const productNotifications = notifications.filter(
                (n) => n.type === "product" && !n.id.startsWith("stored-")
            );

            // Clean up old notifications (older than 5 minutes) to prevent localStorage bloat
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const recentNotifications = productNotifications.filter(
                (notification) => {
                    const notificationTime = new Date(
                        notification.timestamp || notification.created_at
                    ).getTime();
                    return notificationTime > fiveMinutesAgo;
                }
            );

            localStorage.setItem(
                "productNotifications",
                JSON.stringify(recentNotifications)
            );
        } catch (error) {
            // Error saving product notifications - silent fail in production
        }
    };

    // Fetch all notifications (export + order notifications)
    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);

            // Fetch notifications from multiple sources
            const [productsResponse, auditLogsResponse, databaseNotifications] =
                await Promise.all([
                    axios
                        .get(route("products.export-notifications"))
                        .catch(() => ({ data: { notifications: [] } })),
                    axios
                        .get(route("audit-logs.export-notifications"))
                        .catch(() => ({ data: { notifications: [] } })),
                    axios.get("/api/notifications").catch((error) => {
                        console.error(
                            "Database notifications fetch error:",
                            error
                        );
                        return { data: [] };
                    }),
                ]);

            // Combine export notifications
            const exportNotifications = [
                ...(productsResponse.data.notifications || []),
                ...(auditLogsResponse.data.notifications || []),
            ].map((notification) => ({
                ...notification,
                type: "export",
                category: "Export",
            }));

            // Get order notifications from localStorage (real-time only)
            const orderNotifications = getOrderNotifications();

            // Get product notifications from localStorage (real-time only)
            const productNotifications = getProductNotifications();

            // Process database notifications (products, orders, etc.)
            const storedNotifications = (databaseNotifications.data || []).map(
                (notification) => {
                    // Handle product notifications
                    if (notification.type.startsWith("product_")) {
                        return {
                            ...notification,
                            id: `stored-product-${notification.id}`,
                            type: "product",
                            category: "Product",
                            title: `Product ${
                                notification.action === "created"
                                    ? "Created"
                                    : notification.action === "updated"
                                    ? "Updated"
                                    : notification.action === "stock_updated"
                                    ? "Stock Updated"
                                    : "Deleted"
                            }`,
                            message: `${notification.username} ${notification.action} "${notification.productTitle}" - $${notification.price}`,
                            timestamp: notification.time,
                            created_at: notification.time,
                            productId: notification.productId, // Preserve the productId field
                        };
                    }
                    // Handle order notifications
                    else if (notification.type === "order_created") {
                        return {
                            ...notification,
                            id: `stored-order-${notification.id}`,
                            type: "order",
                            category: "Order",
                            title: `New Order #${
                                notification.orderId || "N/A"
                            }`,
                            message: `${
                                notification.customerName || "Customer"
                            } placed an order for ${notification.currency} ${
                                notification.price
                            }`,
                            timestamp: notification.time,
                            created_at: notification.time,
                        };
                    }

                    return notification;
                }
            );

            // Combine all notifications
            const allNotifications = [
                ...exportNotifications,
                ...orderNotifications,
                ...productNotifications,
                ...storedNotifications,
            ];

            // Deduplicate notifications by removing localStorage items that match database notifications
            const deduplicatedNotifications = [];
            const seenIds = new Set();
            const seenKeys = new Set();

            // Add database notifications first (they are the source of truth)
            storedNotifications.forEach((notification) => {
                // Create a unique key based on notification content
                const key =
                    notification.type === "product"
                        ? `product-${notification.productId}-${notification.action}-${notification.productTitle}`
                        : notification.type === "order"
                        ? `order-${notification.orderId}-${notification.customerName}`
                        : `${notification.type}-${notification.id}`;

                if (!seenKeys.has(key)) {
                    deduplicatedNotifications.push(notification);
                    seenIds.add(notification.id);
                    seenKeys.add(key);
                }
            });

            // Add export notifications (these don't duplicate with others)
            exportNotifications.forEach((notification) => {
                if (!seenIds.has(notification.id)) {
                    deduplicatedNotifications.push(notification);
                    seenIds.add(notification.id);
                }
            });

            // Add localStorage notifications only if they don't match database ones
            [...orderNotifications, ...productNotifications].forEach(
                (notification) => {
                    // Create the same unique key format as database notifications
                    const key =
                        notification.type === "product"
                            ? `product-${notification.productId}-${notification.action}-${notification.productTitle}`
                            : notification.type === "order"
                            ? `order-${notification.orderId}-${notification.customerName}`
                            : `${notification.type}-${notification.id}`;

                    // Only add if we haven't seen this combination before
                    if (!seenKeys.has(key) && !seenIds.has(notification.id)) {
                        deduplicatedNotifications.push(notification);
                        seenIds.add(notification.id);
                        seenKeys.add(key);
                    }
                }
            );

            // Sort by timestamp (newest first)
            deduplicatedNotifications.sort(
                (a, b) =>
                    new Date(b.timestamp || b.created_at) -
                    new Date(a.timestamp || a.created_at)
            );

            setNotifications(deduplicatedNotifications);

            // Count unread notifications - consider when notifications were last viewed
            let lastViewedDate = new Date(0); // Default to beginning of time
            try {
                const lastViewed = localStorage.getItem(
                    "notificationsLastViewed"
                );
                if (lastViewed) {
                    lastViewedDate = new Date(lastViewed);
                }
            } catch (error) {
                // Silent fail if localStorage is not available
            }

            const unread = deduplicatedNotifications.filter((n) => {
                const notificationDate = new Date(n.timestamp || n.created_at);

                if (n.type === "export") {
                    return (
                        (n.status === "pending" || n.status === "processing") &&
                        notificationDate > lastViewedDate
                    );
                } else if (n.type === "order") {
                    return !n.read && notificationDate > lastViewedDate;
                } else if (n.type === "product") {
                    return !n.read && notificationDate > lastViewedDate;
                }
                return false;
            }).length;

            console.log("Notification count calculation:", {
                total: deduplicatedNotifications.length,
                unread: unread,
                lastViewed: lastViewedDate.toISOString(),
            });

            setUnreadCount(unread);
        } catch (error) {
            // Failed to fetch notifications - silent fail in production
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Listen for new order notifications via Echo/WebSocket
    useEffect(() => {
        // Check online status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        setIsOnline(navigator.onLine);

        // Setup Echo listeners for both order and product notifications
        if (window.Echo) {
            try {
                // Listen for order notifications
                const orderChannel = window.Echo.channel("orders");
                orderChannelRef.current = orderChannel;

                orderChannel.listen(".order-notification", (data) => {
                    // Create unique key for deduplication
                    const notificationKey = `${data.orderId}-${
                        data.action
                    }-${Date.now()}`;

                    // Global deduplication check
                    if (isInGlobalCache(notificationKey)) {
                        return;
                    }

                    // Local deduplication check
                    if (recentNotificationsRef.current.has(notificationKey)) {
                        return;
                    }

                    // Add to both caches
                    addToGlobalCache(notificationKey);
                    recentNotificationsRef.current.add(notificationKey);

                    // Clean up local cache after 30 seconds
                    setTimeout(() => {
                        recentNotificationsRef.current.delete(notificationKey);
                    }, 30000);

                    const newNotification = {
                        id: `order-${data.orderId}-${Date.now()}`,
                        type: "order",
                        category: "Order",
                        title: `New Order #${data.orderId}`,
                        message: `${data.customerName} placed an order for ${data.currency} ${data.total}`,
                        created_at: new Date().toISOString(),
                        timestamp: new Date().toISOString(),
                        read: false,
                        orderId: data.orderId,
                        customerName: data.customerName,
                        total: data.total,
                        currency: data.currency,
                        action: data.action,
                        productTitle: data.productTitle,
                    };

                    // Update state
                    setNotifications((prev) => {
                        const updated = [newNotification, ...prev];
                        saveOrderNotifications(updated);
                        return updated;
                    });
                    setUnreadCount((prev) => prev + 1);
                });

                // Listen for product notifications
                const productChannel = window.Echo.channel("products");
                productChannelRef.current = productChannel;

                productChannel.listen(".product-changed", (data) => {
                    // Create unique key for deduplication
                    const notificationKey = `product-${data.productId}-${
                        data.action
                    }-${data.username}-${Math.floor(Date.now() / 5000)}`;

                    // Global deduplication check
                    if (isInGlobalCache(notificationKey)) {
                        return;
                    }

                    // Local deduplication check
                    if (recentNotificationsRef.current.has(notificationKey)) {
                        return;
                    }

                    // Add to both caches
                    addToGlobalCache(notificationKey);
                    recentNotificationsRef.current.add(notificationKey);

                    // Clean up local cache after 10 seconds
                    setTimeout(() => {
                        recentNotificationsRef.current.delete(notificationKey);
                    }, 10000);

                    const actionLabels = {
                        created: "Created",
                        updated: "Updated",
                        deleted: "Deleted",
                        stock_updated: "Stock Updated",
                    };

                    const newNotification = {
                        id: `product-${data.productId}-${Date.now()}`,
                        type: "product",
                        category: "Product",
                        title: `Product ${
                            actionLabels[data.action] || data.action
                        }`,
                        message: `${data.username} ${data.action} "${data.productTitle}" - $${data.price}`,
                        created_at: new Date().toISOString(),
                        timestamp: new Date().toISOString(),
                        read: false,
                        productId: data.productId,
                        action: data.action,
                        productTitle: data.productTitle,
                        price: data.price,
                        username: data.username,
                    };

                    // Update state
                    setNotifications((prev) => {
                        const updated = [newNotification, ...prev];
                        // Save both order and product notifications
                        saveOrderNotifications(updated);
                        saveProductNotifications(updated);
                        return updated;
                    });
                    setUnreadCount((prev) => prev + 1);
                });
            } catch (error) {
                setIsOnline(false);
            }
        } else {
            setIsOnline(false);
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);

            // Cleanup order channel
            if (orderChannelRef.current) {
                try {
                    orderChannelRef.current.stopListening(
                        ".order-notification"
                    );
                } catch (error) {
                    // Error cleaning up Echo channel - silent fail in production
                }
            }

            // Cleanup product channel
            if (productChannelRef.current) {
                try {
                    productChannelRef.current.stopListening(".product-changed");
                } catch (error) {
                    // Error cleaning up Echo channel - silent fail in production
                }
            }
        };
    }, []);

    // Smart polling for export notifications
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            const hasActiveExports = notifications.some(
                (n) =>
                    n.type === "export" &&
                    (n.status === "pending" || n.status === "processing")
            );

            if (isDropdownOpen || hasActiveExports) {
                fetchNotifications();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isDropdownOpen, notifications.length]);

    // Handle download for export notifications
    const handleDownload = (notification) => {
        if (notification.type === "export" && notification.can_download) {
            let url;
            if (notification.title.includes("Products Export")) {
                url = route("products.download-export", {
                    export_id: notification.id,
                });
            } else if (notification.title.includes("Audit Logs Export")) {
                url = route("audit-logs.download-export", {
                    export_id: notification.id,
                });
            }
            window.location.href = url;
            setTimeout(fetchNotifications, 1000);
        }
    };

    // Handle dismiss notification
    const handleDismiss = async (notification, event) => {
        event.stopPropagation();

        try {
            if (notification.type === "export") {
                // Handle export notifications
                let url;
                if (notification.title.includes("Products Export")) {
                    url = route(
                        "products.dismiss-notification",
                        notification.id
                    );
                } else if (notification.title.includes("Audit Logs Export")) {
                    url = route(
                        "audit-logs.dismiss-notification",
                        notification.id
                    );
                }
                await axios.post(url);
            } else if (notification.type === "order") {
                // Handle order notifications
                if (notification.id.startsWith("stored-order-")) {
                    // This is a database notification, delete from backend
                    const dbId = notification.id.replace("stored-order-", "");
                    await axios.delete(`/api/notifications/${dbId}`);
                } else {
                    // This is a real-time notification, remove from localStorage
                    const existing = getOrderNotifications();
                    const updated = existing.map((n) =>
                        n.id === notification.id ? { ...n, read: true } : n
                    );
                    localStorage.setItem(
                        "orderNotifications",
                        JSON.stringify(updated)
                    );
                }
            } else if (notification.type === "product") {
                // Handle product notifications
                if (notification.id.startsWith("stored-product-")) {
                    // This is a database notification, delete from backend
                    const dbId = notification.id.replace("stored-product-", "");
                    await axios.delete(`/api/notifications/${dbId}`);
                } else {
                    // This is a real-time notification, mark as dismissed in localStorage
                    const existing = getProductNotifications();
                    const updated = existing.map((n) =>
                        n.id === notification.id ? { ...n, read: true } : n
                    );
                    localStorage.setItem(
                        "productNotifications",
                        JSON.stringify(updated)
                    );
                }
            } else {
                // Handle any other database notifications
                if (notification.id && !isNaN(notification.id)) {
                    // This looks like a database ID, try to delete it
                    await axios.delete(`/api/notifications/${notification.id}`);
                }
            }

            // Remove from local state
            setNotifications((prev) => {
                const updated = prev.filter((n) => n.id !== notification.id);
                if (notification.type === "order") {
                    saveOrderNotifications(updated);
                } else if (notification.type === "product") {
                    saveProductNotifications(updated);
                }
                return updated;
            });
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to dismiss notification:", error);
            // Failed to dismiss notification - still remove from UI for better UX
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notification.id)
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    };

    // Clear all order notifications
    const clearAllOrderNotifications = () => {
        setNotifications((prev) => {
            const updated = prev.filter((n) => n.type !== "order");
            localStorage.removeItem("orderNotifications");
            return updated;
        });
        setUnreadCount((prev) => {
            const orderUnreadCount = notifications.filter(
                (n) => n.type === "order" && !n.read
            ).length;
            return Math.max(0, prev - orderUnreadCount);
        });
    };

    // Clear all product notifications
    const clearAllProductNotifications = () => {
        setNotifications((prev) => {
            const updated = prev.filter((n) => n.type !== "product");
            localStorage.removeItem("productNotifications");
            return updated;
        });
        setUnreadCount((prev) => {
            const productUnreadCount = notifications.filter(
                (n) => n.type === "product" && !n.read
            ).length;
            return Math.max(0, prev - productUnreadCount);
        });
    };

    // Mark all notifications as viewed when dropdown opens
    const markAllAsViewed = useCallback(() => {
        // Reset unread count to 0 when user opens the notification dropdown
        setUnreadCount(0);

        // Mark as read in localStorage for persistence
        try {
            const timestamp = new Date().toISOString();
            localStorage.setItem("notificationsLastViewed", timestamp);
            console.log("Notifications marked as viewed at:", timestamp);
        } catch (error) {
            // Silent fail if localStorage is not available
            console.warn("Failed to save notification view time:", error);
        }
    }, []);

    // Get notification icon based on type and status
    const getNotificationIcon = (notification) => {
        if (notification.type === "order") {
            return <FiShoppingCart className="w-4 h-4 text-blue-500" />;
        }

        if (notification.type === "product") {
            switch (notification.action) {
                case "created":
                    return <FiPackage className="w-4 h-4 text-green-500" />;
                case "updated":
                    return <FiPackage className="w-4 h-4 text-yellow-500" />;
                case "stock_updated":
                    return <FiTrendingUp className="w-4 h-4 text-blue-500" />;
                case "deleted":
                    return <FiPackage className="w-4 h-4 text-red-500" />;
                default:
                    return <FiPackage className="w-4 h-4 text-gray-500" />;
            }
        }

        // Export notification icons
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
                return <FiFileText className="w-4 h-4 text-gray-500" />;
        }
    };

    // Get status color class
    const getStatusColorClass = (notification) => {
        if (notification.type === "order") {
            return "border-l-blue-500";
        }

        if (notification.type === "product") {
            switch (notification.action) {
                case "created":
                    return "border-l-green-500";
                case "updated":
                    return "border-l-yellow-500";
                case "stock_updated":
                    return "border-l-blue-500";
                case "deleted":
                    return "border-l-red-500";
                default:
                    return "border-l-gray-300";
            }
        }

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

    // Format timestamp
    const formatTimeAgo = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    };

    return (
        <Menu as="div" className="relative inline-block text-left">
            {({ open }) => {
                // Use useEffect to handle dropdown state changes instead of direct state update
                useEffect(() => {
                    if (open !== isDropdownOpen) {
                        setIsDropdownOpen(open);
                        if (open) {
                            fetchNotifications();
                            // Mark all notifications as viewed when dropdown opens
                            markAllAsViewed();
                        }
                    }
                }, [open, isDropdownOpen, fetchNotifications, markAllAsViewed]);

                return (
                    <>
                        <div>
                            <Menu.Button className="relative inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full">
                                <FiBell className="w-5 h-5" />
                                {/* Connection status indicator */}
                                {/* <div className="absolute -top-0.5 -left-0.5">
                                    {isOnline ? (
                                        <FaWifi className="w-2.5 h-2.5 text-green-500" title="Connected" />
                                    ) : (
                                        <MdSignalWifiOff className="w-2.5 h-2.5 text-red-500" title="Disconnected" />
                                    )}
                                </div> */}
                                {/* Notification count badge */}
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
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                All Notifications
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                {isLoading && (
                                                    <FiLoader className="w-4 h-4 animate-spin text-gray-500" />
                                                )}
                                                {unreadCount > 0 && (
                                                    <button
                                                        onClick={
                                                            markAllAsViewed
                                                        }
                                                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                                                        title="Mark all as read"
                                                    >
                                                        Mark All Read
                                                    </button>
                                                )}
                                                {notifications.some(
                                                    (n) => n.type === "order"
                                                ) && (
                                                    <button
                                                        onClick={
                                                            clearAllOrderNotifications
                                                        }
                                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                                        title="Clear all order notifications"
                                                    >
                                                        Clear Orders
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="px-4 py-8 text-center text-gray-500">
                                            <FiBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">
                                                No notifications
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
                                                            notification.type ===
                                                                "export" &&
                                                            notification.can_download &&
                                                            handleDownload(
                                                                notification
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                {getNotificationIcon(
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
                                                                    <span
                                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                            notification.type ===
                                                                            "order"
                                                                                ? "bg-blue-100 text-blue-800"
                                                                                : notification.type ===
                                                                                  "product"
                                                                                ? "bg-purple-100 text-purple-800"
                                                                                : "bg-green-100 text-green-800"
                                                                        }`}
                                                                    >
                                                                        {
                                                                            notification.category
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {
                                                                        notification.message
                                                                    }
                                                                </p>

                                                                {/* Export specific info */}
                                                                {notification.type ===
                                                                    "export" &&
                                                                    notification.record_count >
                                                                        0 && (
                                                                        <p className="text-xs text-gray-400 mt-1">
                                                                            {notification.record_count.toLocaleString()}{" "}
                                                                            records
                                                                        </p>
                                                                    )}

                                                                {/* Order specific info */}
                                                                {notification.type ===
                                                                    "order" && (
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        Order #
                                                                        {
                                                                            notification.orderId
                                                                        }{" "}
                                                                        -{" "}
                                                                        {
                                                                            notification.currency
                                                                        }{" "}
                                                                        {
                                                                            notification.total
                                                                        }
                                                                    </p>
                                                                )}

                                                                {/* Product specific info */}
                                                                {notification.type ===
                                                                    "product" && (
                                                                    <p className="text-xs text-gray-400 mt-1">
                                                                        Product
                                                                        ID:{" "}
                                                                        {
                                                                            notification.productId
                                                                        }{" "}
                                                                        - $
                                                                        {
                                                                            notification.price
                                                                        }
                                                                    </p>
                                                                )}

                                                                <div className="flex items-center justify-between mt-2">
                                                                    <p className="text-xs text-gray-400">
                                                                        {notification.time_ago ||
                                                                            formatTimeAgo(
                                                                                notification.created_at ||
                                                                                    notification.timestamp
                                                                            )}
                                                                    </p>

                                                                    <div className="flex items-center space-x-2">
                                                                        {/* Export progress */}
                                                                        {notification.type ===
                                                                            "export" &&
                                                                            notification.status ===
                                                                                "processing" && (
                                                                                <div className="flex items-center space-x-2">
                                                                                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                                        <div
                                                                                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                                                                                            style={{
                                                                                                width: `${
                                                                                                    notification.progress ||
                                                                                                    0
                                                                                                }%`,
                                                                                            }}
                                                                                        ></div>
                                                                                    </div>
                                                                                    <span className="text-xs text-gray-500">
                                                                                        {notification.progress ||
                                                                                            0}

                                                                                        %
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                        {/* Download button */}
                                                                        {notification.type ===
                                                                            "export" &&
                                                                            notification.can_download && (
                                                                                <button className="inline-flex items-center text-xs text-green-600 hover:text-green-800 font-medium">
                                                                                    <FiDownload className="w-3 h-3 mr-1" />
                                                                                    Download
                                                                                </button>
                                                                            )}

                                                                        {/* Dismiss button */}
                                                                        <button
                                                                            onClick={(
                                                                                e
                                                                            ) =>
                                                                                handleDismiss(
                                                                                    notification,
                                                                                    e
                                                                                )
                                                                            }
                                                                            className="inline-flex items-center text-xs text-gray-400 hover:text-gray-600 font-medium"
                                                                            title="Dismiss notification"
                                                                        >
                                                                            <FiX className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
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
