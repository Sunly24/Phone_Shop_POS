import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTimes, FaTrash, FaList, FaWifi } from "react-icons/fa";
import { MdSignalWifiOff } from "react-icons/md";

export default function OrderNotification() {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOnline, setIsOnline] = useState(true);
    const [showAllNotifications, setShowAllNotifications] = useState(false);
    const bellRef = useRef();
    const channelRef = useRef(null);

    // Global debounce mechanism for preventing duplicates across browser tabs
    const recentNotificationsRef = useRef(new Set());

    // Cross-tab duplicate prevention using localStorage
    const addToGlobalCache = (key) => {
        try {
            const cache = JSON.parse(localStorage.getItem('notification_cache') || '{}');
            cache[key] = Date.now();
            localStorage.setItem('notification_cache', JSON.stringify(cache));

            // Clean up old entries (older than 30 seconds)
            const now = Date.now();
            Object.keys(cache).forEach(k => {
                if (now - cache[k] > 30000) {
                    delete cache[k];
                }
            });
            localStorage.setItem('notification_cache', JSON.stringify(cache));
        } catch (e) {
        }
    };

    const isInGlobalCache = (key) => {
        try {
            const cache = JSON.parse(localStorage.getItem('notification_cache') || '{}');
            const timestamp = cache[key];
            if (timestamp && Date.now() - timestamp < 30000) {
                return true;
            }
        } catch (e) {
        }
        return false;
    };

    // Load notifications from database on component mount
    useEffect(() => {
        loadNotificationsFromDatabase();
        loadUnreadCount();

        // Check online status
        setIsOnline(navigator.onLine);

        // Listen for online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Setup real-time notifications
    useEffect(() => {
        // Wait for Echo to be available
        if (typeof window.Echo === 'undefined') {
            const checkEcho = setInterval(() => {
                if (window.Echo) {
                    clearInterval(checkEcho);
                    setupNotifications();
                }
            }, 100);
            return () => clearInterval(checkEcho);
        } else {
            setupNotifications();
        }

        function setupNotifications() {
            try {
                // Check if Echo is properly configured
                if (!window.Echo.connector || !window.Echo.connector.pusher) {
                    
                    return;
                }

                // Debug Pusher connection

                // Listen for connection events
                window.Echo.connector.pusher.connection.bind('connected', () => {
                    setIsOnline(true);
                });

                window.Echo.connector.pusher.connection.bind('disconnected', () => {
                    setIsOnline(false);
                });

                window.Echo.connector.pusher.connection.bind('error', (error) => {
                    
                    setIsOnline(false);
                });

                window.Echo.connector.pusher.connection.bind('state_change', (states) => {
                });

                // Use Laravel Echo to listen to the products channel
                const productChannel = window.Echo.channel('products');
                channelRef.current = productChannel;


                // Listen for the product-changed event (both ProductNotification and ProductChanged broadcast with this name)
                productChannel.listen('.product-changed', function (data) {

                    // Create a unique key for this notification to prevent duplicates across all browser tabs
                    const notificationKey = `product-${data.productId}-${data.action}-${data.username}-${Math.floor(Date.now() / 5000)}`;

                    // Check cross-tab duplicate prevention first
                    if (isInGlobalCache(notificationKey)) {
                        return;
                    }

                    // Check if we've recently processed this exact notification in this tab
                    if (recentNotificationsRef.current.has(notificationKey)) {
                        return;
                    }

                    // Add to both caches
                    addToGlobalCache(notificationKey);
                    recentNotificationsRef.current.add(notificationKey);
                    setTimeout(() => {
                        recentNotificationsRef.current.delete(notificationKey);
                    }, 10000);

                    // Add real-time notification to existing list with duplicate prevention
                    const newNotification = {
                        id: `temp-${data.productId}-${data.action}-${Date.now()}`,
                        action: data.action,
                        productTitle: data.productTitle,
                        price: data.price,
                        username: data.username,
                        time: new Date().toLocaleString(),
                        timeAgo: 'Just now',
                        read: false,
                        type: `product_${data.action}`,
                        created_at: new Date().toISOString(),
                        productId: data.productId, // Add productId for better duplicate detection
                    };

                    setNotifications((prev) => {
                        // Simple duplicate check - just ensure we don't have the exact same notification already
                        const isDuplicate = prev.some(n => {
                            if (data.action === 'updated') {
                                // For product updates, check by product ID and action
                                return n.productId === data.productId && n.action === data.action && n.type === `product_${data.action}`;
                            } else {
                                // For create/delete, check by title and action
                                return n.productTitle === data.productTitle && n.action === data.action && n.type === `product_${data.action}`;
                            }
                        });

                        if (!isDuplicate) {
                            setUnreadCount(prev => prev + 1);
                            return [newNotification, ...prev];
                        } else {
                            return prev;
                        }
                    });
                });

                // Use Laravel Echo to listen to the orders channel
                const orderChannel = window.Echo.channel('orders');


                // Listen for the order-notification event
                orderChannel.listen('.order-notification', function (data) {

                    // Create a unique key for this notification to prevent duplicates across all browser tabs
                    const notificationKey = `order-${data.orderId}-${data.action}-${data.username}-${Math.floor(Date.now() / 5000)}`;

                    // Check cross-tab duplicate prevention first
                    if (isInGlobalCache(notificationKey)) {
                        return;
                    }

                    // Add to global cache
                    addToGlobalCache(notificationKey);

                    // Add real-time notification to existing list with duplicate prevention
                    const newNotification = {
                        id: `temp-order-${data.orderId}-${data.action}-${Date.now()}`,
                        action: data.action,
                        productTitle: data.productTitle || 'Phone',
                        orderId: data.orderId,
                        price: data.total,
                        username: data.username,
                        customerName: data.customerName,
                        currency: data.currency,
                        time: new Date().toLocaleString(),
                        timeAgo: 'Just now',
                        read: false,
                        type: `order_${data.action}`,
                        created_at: new Date().toISOString(),
                    };

                    setNotifications((prev) => {
                        // Simple duplicate check - just ensure we don't have the exact same notification already
                        const isDuplicate = prev.some(n =>
                            n.orderId === data.orderId &&
                            n.action === data.action &&
                            n.type === `order_${data.action}`
                        );

                        if (!isDuplicate) {
                            setUnreadCount(prev => prev + 1);
                            return [newNotification, ...prev];
                        } else {
                            return prev;
                        }
                    });
                });

            } catch (error) {
                
            }
        }

        return () => {
            // Cleanup Echo channels
            if (channelRef.current) {
                try {
                    window.Echo.leaveChannel('products');
                    window.Echo.leaveChannel('orders');
                } catch (error) {
                }
            }

            // Clean up localStorage cache on unmount
            try {
                const cache = JSON.parse(localStorage.getItem('notification_cache') || '{}');
                const now = Date.now();
                Object.keys(cache).forEach(key => {
                    if (now - cache[key] > 30000) {
                        delete cache[key];
                    }
                });
                localStorage.setItem('notification_cache', JSON.stringify(cache));
            } catch (e) {
            }
        };
    }, []);

    // Load notifications from database
    const loadNotificationsFromDatabase = async () => {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();

                // Remove any temporary notifications that might be duplicates
                setNotifications(prev => {
                    // Keep only temp notifications that don't have database equivalents
                    const tempNotifications = prev.filter(n => {
                        if (!n.id.toString().startsWith('temp-')) {
                            return false; // Not a temp notification
                        }

                        // Check if this temp notification has a database equivalent
                        const hasDatabaseEquivalent = data.some(dbN => {
                            // Enhanced comparison for product updates
                            if (n.action === 'updated' && dbN.action === 'updated') {
                                return (
                                    dbN.productTitle === n.productTitle &&
                                    dbN.action === n.action &&
                                    dbN.username === n.username &&
                                    Math.abs(new Date(dbN.created_at) - new Date(n.created_at)) < 15000 // 15 seconds for updates
                                ) || (
                                        // Also check by productId if available
                                        dbN.productId === n.productId &&
                                        dbN.action === n.action &&
                                        Math.abs(new Date(dbN.created_at) - new Date(n.created_at)) < 15000
                                    );
                            } else {
                                // For other actions, use original logic
                                return (
                                    dbN.productTitle === n.productTitle &&
                                    dbN.action === n.action &&
                                    dbN.username === n.username &&
                                    Math.abs(new Date(dbN.created_at) - new Date(n.created_at)) < 10000
                                );
                            }
                        });

                        return !hasDatabaseEquivalent; // Keep if no database equivalent found
                    });

                    // Combine database notifications with remaining temp notifications
                    const combined = [...tempNotifications, ...data];
                    return combined;
                });

            } else {
                
            }
        } catch (error) {
            
        }
    };

    // Load unread count
    const loadUnreadCount = async () => {
        try {
            const response = await fetch('/api/notifications/unread-count');
            if (response.ok) {
                const data = await response.json();
                setUnreadCount(data.count);
            } else {
                
            }
        } catch (error) {
            
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        // For temporary notifications (starts with 'temp-'), just mark as read locally
        if (notificationId.toString().startsWith('temp-')) {
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
            return;
        }

        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n =>
                        n.id === notificationId ? { ...n, read: true } : n
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            
        }
    };

    // Clear all notifications
    const clearAllNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    // Delete individual notification
    const deleteNotification = (notificationId, event) => {
        event.stopPropagation(); // Prevent triggering markAsRead
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Only decrease unread count if the notification was unread
        const notification = notifications.find(n => n.id === notificationId);
        if (notification && !notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };


    // Handle click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Use unreadCount state instead of calculating from notifications array
    // This ensures consistency between real-time updates and database state
    const displayCount = unreadCount;

    // Filter notifications based on showAllNotifications state and remove duplicates
    const filteredNotifications = (() => {
        // Remove duplicates when displaying notifications
        const uniqueNotifications = notifications.filter((notification, index, arr) => {
            // Find if there's a duplicate notification
            const duplicateIndex = arr.findIndex((n, i) => {
                if (i >= index) return false; // Only check previous items

                // Enhanced duplicate detection for display
                if (notification.action === 'updated' && n.action === 'updated') {
                    return (
                        n.productTitle === notification.productTitle &&
                        n.action === notification.action &&
                        n.username === notification.username &&
                        Math.abs(new Date(n.created_at || n.time) - new Date(notification.created_at || notification.time)) < 15000
                    );
                } else {
                    return (
                        n.productTitle === notification.productTitle &&
                        n.action === notification.action &&
                        n.username === notification.username &&
                        Math.abs(new Date(n.created_at || n.time) - new Date(notification.created_at || notification.time)) < 10000
                    );
                }
            });

            return duplicateIndex === -1; // Keep if no duplicate found
        });

        return showAllNotifications
            ? uniqueNotifications
            : uniqueNotifications.slice(0, 5); // Show only first 5 notifications when collapsed
    })();

    return (
        <div className="relative" ref={bellRef}>
            <button
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white transition duration-200 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 shadow-md"
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpen((prev) => !prev);
                }}
                type="button"
            >
                <FaBell className="w-5 h-5" />
                {displayCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full transform translate-x-1 -translate-y-1">
                        {displayCount > 99 ? '99+' : displayCount}
                    </span>
                )}
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <span className="text-lg font-bold text-gray-800">Notifications</span>
                                {displayCount > 0 && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                        {displayCount} new
                                    </span>
                                )}
                                {/* Online/Offline Indicator */}
                                <div className="flex items-center space-x-1">
                                    {isOnline ? (
                                        <>
                                            <FaWifi className="w-3 h-3 text-green-500" />
                                            <span className="text-xs text-green-600 font-medium">Online</span>
                                        </>
                                    ) : (
                                        <>
                                            <MdSignalWifiOff className="w-3 h-3 text-red-500" />
                                            <span className="text-xs text-red-600 font-medium">Offline</span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <ul className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                        {filteredNotifications.length === 0 ? (
                            <li className="p-6 text-center">
                                <div className="text-gray-400 mb-2">
                                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-500 font-medium">
                                    No new notifications
                                </span>
                            </li>
                        ) : (
                            filteredNotifications.map((n, i) => (
                                <li
                                    key={n.id || i}
                                    className={`px-4 py-3 hover:bg-gray-50 transition-colors duration-150 cursor-pointer group ${!n.read ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}
                                    onClick={() => markAsRead(n.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start flex-1 min-w-0">
                                            <div className="flex-shrink-0 mt-0.5 mr-3">
                                                <div className={`w-2.5 h-2.5 rounded-full ${n.type?.startsWith('order_')
                                                        ? (n.action === "created" ? "bg-green-500" : n.action === "deleted" ? "bg-red-500" : "bg-blue-500")
                                                        : (n.action === "created" ? "bg-green-500" : n.action === "updated" ? "bg-blue-500" : n.action === "deleted" ? "bg-red-500" : "bg-gray-500")
                                                    }`}></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-gray-800 truncate">
                                                    {n.type?.startsWith('order_') ? (
                                                        <span>{n.productTitle}</span>
                                                    ) : (
                                                        n.productTitle
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="text-xs text-gray-500">
                                                        {n.type?.startsWith('order_') ? (
                                                            <span>Order <span className="capitalize">{n.action}</span> for <span className="font-medium">{n.customerName}</span> by <span className="font-medium">{n.username}</span></span>
                                                        ) : (
                                                            <span><span className="capitalize">{n.action}</span> by <span className="font-medium">{n.username}</span></span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-medium text-gray-400">
                                                        {n.timeAgo || n.time}
                                                    </div>
                                                </div>
                                                <div className="mt-1 text-sm font-bold text-blue-600">
                                                    {n.type?.startsWith('order_') && n.currency ? (
                                                        n.currency === 'KHR'
                                                            ? `${parseFloat(n.price * 4000).toLocaleString()} ៛`
                                                            : `$${parseFloat(n.price).toFixed(2)}`
                                                    ) : (
                                                        `$${parseFloat(n.price).toFixed(2)}`
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => deleteNotification(n.id, e)}
                                            className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                            title="Delete notification"
                                        >
                                            <FaTrash className="w-3 h-3" />
                                        </button>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>

                    {/* Footer Actions */}
                    {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100">
                            <div className="flex items-center justify-between space-x-2">
                                {/* Show All/Show Less Toggle */}
                                {notifications.length > 5 && (
                                    <button
                                        onClick={() => setShowAllNotifications(!showAllNotifications)}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 flex items-center"
                                    >
                                        <FaList className="w-3 h-3 mr-1" />
                                        {showAllNotifications ? 'Show Less' : `Show All (${notifications.length})`}
                                    </button>
                                )}

                                {/* Clear All Button */}
                                <button
                                    onClick={clearAllNotifications}
                                    className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200 flex items-center"
                                >
                                    <FaTrash className="w-3 h-3 mr-1" />
                                    Clear All
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}