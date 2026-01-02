import React, { useState, useRef, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    AiOutlineUser,
    AiOutlineSend,
    AiOutlineRobot,
    AiOutlineClockCircle,
    AiOutlineCheckCircle,
    AiOutlineExclamationCircle,
    AiOutlineMore,
    AiOutlinePhone,
    AiOutlineMail,
    AiOutlineClose,
    AiOutlineInfoCircle,
    AiOutlineDelete,
    AiOutlineMessage,
} from "react-icons/ai";
import axios from "axios";

const ChatInterface = ({
    sessionId,
    sessionInfo,
    initialMessages = [],
    onStatusUpdate,
    onDeleteConversation,
    showHeader = true,
    showInfoPanel = true,
    headerContent = null,
    className = "",
}) => {
    const messagesEndRef = useRef(null);
    const [statusUpdate, setStatusUpdate] = useState(
        sessionInfo?.status || "pending"
    );
    const [showInfo, setShowInfo] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [messages, setMessages] = useState(initialMessages);

    const { data, setData, post, processing, errors, reset } = useForm({
        message: "",
    });

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Update messages when initialMessages prop changes
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    // Mark messages as read when admin views the chat
    useEffect(() => {
        if (sessionId && messages.length > 0) {
            // Mark all user messages as read when admin opens the chat
            const markMessagesAsRead = async () => {
                try {
                    await axios.put(route("chat.markAsRead", sessionId));
                } catch (error) {}
            };

            markMessagesAsRead();
        }
    }, [sessionId, messages.length]);

    // Set up real-time listening for new messages
    useEffect(() => {
        if (!sessionId || !window.Echo) {
            console.warn(
                "Real-time chat disabled: Missing sessionId or Echo not available"
            );
            return;
        }

        let cleanupFunction = null;

        try {
            const channel = window.Echo.channel(`chat.${sessionId}`);

            // Processing function for new messages
            const processMessage = (e) => {
                if (!e || (!e.message && !e.text)) {
                    return;
                }

                const newMessage = {
                    id: e.id || `temp-${Date.now()}`,
                    message: e.message || e.text || "",
                    sender: e.sender || "user",
                    user_name: e.user_name || "User",
                    user_email: e.user_email,
                    user_phone: e.user_phone,
                    created_at: e.created_at || new Date().toISOString(),
                    session_id: e.session_id || sessionId,
                    support_user: null,
                    user: null,
                    support_user_id: e.support_user_id,
                    user_id: e.user_id,
                    assigned_to: e.assigned_to,
                    is_read: e.is_read || false,
                    status: e.status || "pending",
                };

                setMessages((prev) => {
                    const exists = prev.some((m) => m.id === newMessage.id);
                    if (exists) {
                        return prev;
                    }
                    return [...prev, newMessage];
                });
            };

            // Listen for message events
            channel.listen("MessageSent", processMessage);
            channel.listen(".MessageSent", processMessage);
            channel.listen("message.sent", processMessage);
            channel.listen(".message.sent", processMessage);
            channel.listen("App\\Events\\MessageSent", processMessage);

            // Also listen on the notifications channel for user messages
            const notificationsChannel =
                window.Echo.channel("chat.notifications");
            notificationsChannel.listen("message.sent", (e) => {
                if (e.session_id === sessionId) {
                    processMessage(e);
                }
            });
            notificationsChannel.listen(".message.sent", (e) => {
                if (e.session_id === sessionId) {
                    processMessage(e);
                }
            });

            // Handle channel subscription confirmation
            channel.subscribed(() => {});

            // Handle channel errors
            channel.error((error) => {});

            cleanupFunction = () => {
                try {
                    window.Echo.leaveChannel(`chat.${sessionId}`);
                    window.Echo.leaveChannel("chat.notifications");
                } catch (error) {}
            };
        } catch (error) {}

        return () => {
            if (cleanupFunction) cleanupFunction();
        };
    }, [sessionId]);

    // Fallback polling for messages when Echo isn't working
    useEffect(() => {
        if (!sessionId) return;

        let pollingInterval;

        const shouldPoll =
            !window.Echo ||
            window.Echo.connector?.pusher?.connection?.state !== "connected";

        if (shouldPoll) {
            pollingInterval = setInterval(() => {
                axios
                    .get(`/api/chat/messages/${sessionId}`)
                    .then((response) => {
                        if (response.data && Array.isArray(response.data)) {
                            setMessages(response.data);
                        }
                    })
                    .catch((error) => {
                        console.error("Polling error:", error);
                    });
            }, 5000);
        }

        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [sessionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleReply = (e) => {
        e.preventDefault();

        if (!data.message.trim()) return;

        post(route("chat.reply", sessionId), {
            preserveScroll: true,
            onSuccess: () => {
                reset("message");
                scrollToBottom();
            },
        });
    };

    const handleStatusUpdate = (newStatus) => {
        setStatusUpdate(newStatus);
        if (onStatusUpdate) {
            onStatusUpdate(newStatus);
        }
    };

    const handleDeleteConversation = () => {
        if (onDeleteConversation) {
            onDeleteConversation();
        }
        setShowDeleteModal(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "#f59e0b";
            case "answered":
                return "#10b981";
            case "closed":
                return "#6b7280";
            default:
                return "#6b7280";
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending:
                "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border border-amber-200",
            answered:
                "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200",
            closed: "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200",
        };
        return (
            badges[status] ||
            "bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700 border border-slate-200"
        );
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "pending":
                return (
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                );
            case "answered":
                return (
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                );
            case "closed":
                return (
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                );
            default:
                return (
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                );
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return "";

        try {
            const date = new Date(timestamp);
            const now = new Date();
            const diffInHours = (now - date) / (1000 * 60 * 60);

            if (diffInHours < 24) {
                // Same day - show time
                return date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });
            } else if (diffInHours < 48) {
                // Yesterday
                return `Yesterday ${date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                })}`;
            } else if (diffInHours < 168) {
                // This week - show day name
                return date.toLocaleDateString([], {
                    weekday: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                });
            } else {
                // Older - show date
                return date.toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });
            }
        } catch (error) {
            return "";
        }
    };

    const handleRefreshMessages = () => {
        window.location.reload();
    };

    if (!sessionId || !sessionInfo) {
        return (
            <div
                className={`flex items-center justify-center h-full ${className}`}
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AiOutlineUser className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a conversation
                    </h3>
                    <p className="text-gray-500">
                        Choose a conversation from the list to start chatting
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {/* Chat Header */}
            {showHeader && (
                <div className="border-b border-gray-200 bg-white">
                    {/* Top Header Row - Take Conversation and Assign Buttons */}
                    {headerContent && (
                        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                            <div className="flex justify-end">
                                {headerContent}
                            </div>
                        </div>
                    )}

                    {/* Main Header Row */}
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                                    {(sessionInfo.user_name || "U")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div>
                                    <h1 className="text-lg font-semibold text-gray-900">
                                        {sessionInfo.user_name ||
                                            "Anonymous User"}
                                    </h1>
                                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                                        <span className="flex items-center">
                                            <div className="w-4 h-4 bg-gradient-to-br from-gray-400 to-gray-500 rounded flex items-center justify-center mr-1.5">
                                                <AiOutlineMessage className="w-2.5 h-2.5 text-white" />
                                            </div>
                                            {messages.length} messages
                                        </span>

                                        {/* Status Badge */}
                                        {sessionInfo.status && (
                                            <span
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusBadge(
                                                    sessionInfo.status
                                                )}`}
                                            >
                                                {getStatusIcon(
                                                    sessionInfo.status
                                                )}
                                                <span className="ml-1.5 capitalize">
                                                    {sessionInfo.status}
                                                </span>
                                            </span>
                                        )}

                                        {/* Assignment Indicator */}
                                        {sessionInfo.assignedTo && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 shadow-sm">
                                                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-1.5">
                                                    {sessionInfo.assignedTo.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <span>
                                                    {
                                                        sessionInfo.assignedTo
                                                            .name
                                                    }
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                {showInfoPanel && (
                                    <button
                                        onClick={() => setShowInfo(!showInfo)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <AiOutlineInfoCircle className="w-6 h-6 text-blue-600 hover:text-blue-700" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                <div className="text-center">
                                    <p className="mb-2">No messages yet...</p>
                                    <button
                                        onClick={handleRefreshMessages}
                                        className="text-blue-600 hover:text-blue-700 underline transition-colors"
                                    >
                                        Refresh messages
                                    </button>
                                </div>
                            </div>
                        ) : (
                            messages.map((message, index) => {
                                const isSupport = message.sender === "support";
                                const showTimestamp =
                                    index === 0 ||
                                    new Date(message.created_at).getTime() -
                                        new Date(
                                            messages[index - 1].created_at
                                        ).getTime() >
                                        300000; // 5 minutes

                                return (
                                    <div key={message.id}>
                                        {showTimestamp && (
                                            <div className="flex justify-center mb-2">
                                                <span className="text-xs text-gray-500 bg-white/60 px-2 py-1 rounded-full">
                                                    {formatTime(
                                                        message.created_at
                                                    )}
                                                </span>
                                            </div>
                                        )}

                                        <div
                                            className={`flex ${
                                                isSupport
                                                    ? "justify-end"
                                                    : "justify-start"
                                            } mb-1`}
                                        >
                                            <div
                                                className={`flex items-end max-w-[75%] ${
                                                    isSupport ? "" : "space-x-2"
                                                }`}
                                            >
                                                {/* Avatar - only show for user messages */}
                                                {!isSupport && (
                                                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1">
                                                        {message.user_name
                                                            ? message.user_name
                                                                  .charAt(0)
                                                                  .toUpperCase()
                                                            : "U"}
                                                    </div>
                                                )}

                                                {/* Message content */}
                                                <div
                                                    className={`px-3 py-1.5 shadow-sm ${
                                                        isSupport
                                                            ? "bg-blue-500 text-white rounded-2xl"
                                                            : "bg-white text-gray-800 border border-gray-200 rounded-2xl"
                                                    }`}
                                                >
                                                    <p className="text-sm leading-snug whitespace-pre-line">
                                                        {message.message ||
                                                            message.text ||
                                                            "No message content"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="border-t border-gray-100 p-4 bg-gradient-to-r from-gray-50 to-white">
                        <form onSubmit={handleReply}>
                            <div className="flex items-start space-x-3">
                                <div className="flex-1">
                                    <div className="relative flex items-center bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                                        <textarea
                                            value={data.message}
                                            onChange={(e) =>
                                                setData(
                                                    "message",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Type your message..."
                                            rows="1"
                                            className="flex-1 px-4 py-3 border-0 rounded-2xl focus:ring-0 focus:outline-none resize-none bg-transparent placeholder-gray-400 text-gray-900"
                                            style={{
                                                minHeight: "44px",
                                                maxHeight: "120px",
                                            }}
                                            onKeyPress={(e) => {
                                                if (
                                                    e.key === "Enter" &&
                                                    !e.shiftKey
                                                ) {
                                                    e.preventDefault();
                                                    handleReply(e);
                                                }
                                            }}
                                        />
                                        <div className="flex items-center pr-2">
                                            <button
                                                type="submit"
                                                disabled={
                                                    processing ||
                                                    !data.message.trim()
                                                }
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 ${
                                                    processing ||
                                                    !data.message.trim()
                                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md"
                                                }`}
                                            >
                                                <AiOutlineSend className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {errors.message && (
                                        <p className="text-red-500 text-xs mt-1 ml-1">
                                            {errors.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Info Modal Dialog */}
            {showInfo && showInfoPanel && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] shadow-2xl transform scale-100 transition-all overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Contact Info
                            </h3>
                            <button
                                onClick={() => setShowInfo(false)}
                                className="p-2 hover:bg-red-400 rounded-full transition-colors"
                            >
                                <AiOutlineClose className="w-4 h-4 text-gray-500 hover:text-white" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="overflow-y-auto p-6 pt-4">
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4 shadow-lg">
                                        {sessionInfo.user_name
                                            ? sessionInfo.user_name
                                                  .charAt(0)
                                                  .toUpperCase()
                                            : "U"}
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {sessionInfo.user_name ||
                                            "Anonymous User"}
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <AiOutlineMail className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    Email
                                                </p>
                                                <p className="text-sm text-gray-500 break-all">
                                                    {sessionInfo.user_email ||
                                                        "Not provided"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <AiOutlinePhone className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    Phone
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {sessionInfo.user_phone ||
                                                        "Not provided"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <AiOutlineClockCircle className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    Last Active
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatTime(
                                                        sessionInfo.updated_at
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 hover:border-red-300"
                                    >
                                        <AiOutlineDelete className="w-4 h-4" />
                                        <span>Delete Conversation</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform scale-100 transition-all">
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                            <AiOutlineDelete className="w-6 h-6 text-red-600 hover:text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center hover:bg-red-500 hover:text-white rounded-xl transition-colors">
                            Delete Conversation
                        </h3>
                        <p className="text-gray-600 mb-6 text-center">
                            Are you sure you want to delete this conversation?
                            This action cannot be undone.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConversation}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl transition-all shadow-md"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
