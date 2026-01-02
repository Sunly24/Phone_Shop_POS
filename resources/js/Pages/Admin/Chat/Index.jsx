import React, { useState, useEffect, useCallback } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import { ChatShow } from "./Show";
import axios from "axios";
import {
    AiOutlineSearch,
    AiOutlineMessage,
    AiOutlineMail,
    AiOutlineUser,
} from "react-icons/ai";

export default function Index({
    messages,
    sessions: initialSessions,
    filters,
    currentFilter,
    assignmentStats,
    selectedSession = null,
    auth,
}) {
    const [sessions, setSessions] = useState(initialSessions || []);
    const [search, setSearch] = useState(filters?.search || "");
    const [statusFilter, setStatusFilter] = useState(
        filters?.status || currentFilter || "all"
    );
    const [isLoading, setIsLoading] = useState(false);

    // Client-side filtered sessions (exactly like Shop.jsx filteredProducts)
    const [filteredSessions, setFilteredSessions] = useState(
        initialSessions || []
    );
    const [isFiltering, setIsFiltering] = useState(false);

    // Right panel state - for Show.jsx functionality
    const [currentSession, setCurrentSession] = useState(selectedSession);
    const [currentMessages, setCurrentMessages] = useState([]);
    const [currentAssignedAgent, setCurrentAssignedAgent] = useState(null);
    const [availableAgents, setAvailableAgents] = useState([]);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Filter sessions client-side for smooth experience (exactly like Shop.jsx)
    const filterSessionsClientSide = useCallback(
        (searchTerm, statusValue) => {
            setIsFiltering(true);

            let filtered = sessions || [];

            // Apply search filter - only by user name
            if (searchTerm && searchTerm.trim()) {
                filtered = filtered.filter((session) => {
                    const searchLower = searchTerm.toLowerCase();
                    return session.user_name
                        ?.toLowerCase()
                        .includes(searchLower);
                });
            }

            // Apply status filter
            if (statusValue && statusValue !== "all") {
                filtered = filtered.filter(
                    (session) => session.status === statusValue
                );
            }

            // Small delay to show filtering state (same timing as Shop.jsx)
            setTimeout(() => {
                setFilteredSessions(filtered);
                setIsFiltering(false);
            }, 200);
        },
        [sessions]
    );

    // Set up real-time listening for new messages to update unread counts
    useEffect(() => {
        // Listen for new messages via broadcasting or polling
        const interval = setInterval(() => {
            // Refresh sessions data every 30 seconds if not currently loading
            if (!isLoading && !isFiltering) {
                router.get(
                    route("chat.index"),
                    {},
                    {
                        preserveState: true,
                        preserveScroll: true,
                        only: ["sessions", "assignmentStats"], // Only update sessions data
                        onError: (errors) => {
                            console.error("Error refreshing sessions:", errors);
                        },
                    }
                );
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [isLoading, isFiltering]);

    // Debounced search effect (like Shop.jsx)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            filterSessionsClientSide(search, statusFilter);
        }, 300); // Same timing as Shop.jsx

        return () => clearTimeout(timeoutId);
    }, [search, statusFilter, filterSessionsClientSide]);

    // Initialize filtered sessions
    useEffect(() => {
        filterSessionsClientSide(search, statusFilter);
    }, []);

    // Update sessions when props change
    useEffect(() => {
        setSessions(initialSessions || []);

        // Update filtered sessions as well
        setTimeout(() => {
            filterSessionsClientSide(search, statusFilter);
        }, 100);

        // Log assignment data for debugging
        if (initialSessions && initialSessions.length > 0) {
            console.log(
                "Sessions updated with assignment data:",
                initialSessions.map((s) => ({
                    session_id: s.session_id,
                    assigned_to: s.assigned_to,
                    assignedTo: s.assignedTo,
                    user_name: s.user_name,
                }))
            );
        }

        // If we have a current session, update its assignment status from the new data
        if (currentSession && initialSessions) {
            const updatedSession = initialSessions.find(
                (s) => s.session_id === currentSession.session_id
            );

            if (updatedSession) {
                setCurrentSession(updatedSession);

                // Update assigned agent state
                if (updatedSession.assigned_to && updatedSession.assignedTo) {
                    setCurrentAssignedAgent(updatedSession.assignedTo);
                } else {
                    setCurrentAssignedAgent(null);
                }

                console.log("Updated session assignment from props:", {
                    session_id: updatedSession.session_id,
                    assigned_to: updatedSession.assigned_to,
                    assignedTo: updatedSession.assignedTo,
                });
            }
        }
    }, [initialSessions, currentSession?.session_id]);

    // Update filters when props change
    useEffect(() => {
        if (filters?.search !== undefined) {
            setSearch(filters.search);
        }
        if (filters?.status !== undefined) {
            setStatusFilter(filters.status);
        }
    }, [filters]);

    // Simple search functionality (like Shop.jsx)
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearch(value);
        // Client-side filtering will be triggered by useEffect
    };

    const handleStatusChange = (newStatus) => {
        setStatusFilter(newStatus);
        // Client-side filtering will be triggered by useEffect
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("all");
        // useEffect will trigger and reset to all sessions
    };

    const handleFilterChange = (newFilter) => {
        setIsLoading(true);
        router.get(
            route("chat.index"),
            { filter: newFilter },
            {
                preserveState: true,
                onFinish: () => setIsLoading(false),
                onError: (errors) => {
                    console.error("Error changing filter:", errors);
                    setIsLoading(false);
                },
            }
        );
    };

    const handleTakeSession = async (sessionId) => {
        try {
            router.post(
                route("chat.take", sessionId),
                {},
                {
                    onSuccess: () => {
                        router.reload({ only: ["sessions"] });
                    },
                    onError: (errors) => {
                        console.error("Error taking session:", errors);
                    },
                }
            );
        } catch (error) {
            console.error("Error taking session:", error);
        }
    };

    // Session selection for right panel
    const handleSessionSelect = async (session) => {
        setCurrentSession(session);

        try {
            const response = await axios.get(
                route("chat.messages", session.session_id)
            );

            if (response.data && Array.isArray(response.data)) {
                setCurrentMessages(response.data);
            } else if (response.data && Array.isArray(response.data.messages)) {
                setCurrentMessages(response.data.messages);
            } else {
                setCurrentMessages([]);
            }

            // Mark messages as read when admin selects a session
            try {
                await axios.put(route("chat.markAsRead", session.session_id));

                // Update the unread count for this session in the local state
                setSessions((prevSessions) =>
                    prevSessions.map((s) =>
                        s.session_id === session.session_id
                            ? { ...s, unread_count: 0 }
                            : s
                    )
                );
            } catch (readError) {
                console.error("Error marking messages as read:", readError);
            }

            // Set assigned agent info if available - ensure proper assignment tracking
            console.log("Session assignment data:", {
                assigned_to: session.assigned_to,
                assignedTo: session.assignedTo,
            });

            if (session.assigned_to && session.assignedTo) {
                setCurrentAssignedAgent(session.assignedTo);
            } else {
                setCurrentAssignedAgent(null);
            }

            // Fetch available agents for assignment modal
            try {
                const agentsResponse = await axios.get(
                    route("chat.available-agents")
                );

                if (agentsResponse.data && Array.isArray(agentsResponse.data)) {
                    setAvailableAgents(agentsResponse.data);
                }
            } catch (agentError) {
                console.error("Error fetching agents:", agentError);
                setAvailableAgents([]);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            setCurrentMessages([]);
        }
    };

    const handleStatusUpdate = (newStatus) => {
        if (!currentSession) return;

        router.put(
            route("chat.update-status", currentSession.session_id),
            {
                status: newStatus,
            },
            {
                onSuccess: () => {
                    setCurrentSession({ ...currentSession, status: newStatus });
                },
            }
        );
    };

    const handleDeleteConversation = () => {
        if (!currentSession) return;

        router.delete(route("chat.destroy", currentSession.session_id), {
            onSuccess: () => {
                setCurrentSession(null);
                setCurrentMessages([]);
                window.location.reload();
            },
        });
    };

    const handleAssignAgent = (agentId) => {
        if (!currentSession) return;

        if (agentId === "unassign") {
            router.post(
                route("chat.unassign", currentSession.session_id),
                {},
                {
                    onSuccess: () => {
                        console.log(
                            "Unassign success, clearing assignment states"
                        );

                        setCurrentAssignedAgent(null);
                        setCurrentSession((prev) => ({
                            ...prev,
                            assigned_to: null,
                            assignedTo: null,
                        }));
                        setShowAssignModal(false);

                        // Update sessions list
                        setSessions((prevSessions) =>
                            prevSessions.map((session) => {
                                if (
                                    session.session_id ===
                                    currentSession.session_id
                                ) {
                                    return {
                                        ...session,
                                        assigned_to: null,
                                        assignedTo: null,
                                    };
                                }
                                return session;
                            })
                        );

                        setTimeout(() => {
                            router.reload({
                                only: ["sessions"],
                                preserveState: true,
                                preserveScroll: true,
                            });
                        }, 100);
                    },
                    onError: (errors) => {
                        console.error(
                            "Error unassigning conversation:",
                            errors
                        );
                    },
                }
            );
        } else if (agentId === "auto") {
            router.post(
                route("chat.autoAssign", currentSession.session_id),
                {},
                {
                    onSuccess: (response) => {
                        const assignedAgent = response.props?.agent;

                        console.log("Auto-assign success:", assignedAgent);

                        setCurrentAssignedAgent(assignedAgent || null);
                        setCurrentSession((prev) => ({
                            ...prev,
                            assigned_to: assignedAgent?.id,
                            assignedTo: assignedAgent,
                        }));
                        setShowAssignModal(false);

                        setTimeout(() => {
                            router.reload({
                                only: ["sessions"],
                                preserveState: true,
                                preserveScroll: true,
                            });
                        }, 100);
                    },
                    onError: (errors) => {
                        console.error(
                            "Error auto-assigning conversation:",
                            errors
                        );
                    },
                }
            );
        } else {
            router.post(
                route("chat.assign", currentSession.session_id),
                {
                    agent_id: agentId,
                },
                {
                    onSuccess: (response) => {
                        const assignedAgentData = availableAgents?.find(
                            (agent) => agent.id === parseInt(agentId)
                        );

                        console.log(
                            "Manual assign success:",
                            assignedAgentData
                        );

                        setCurrentAssignedAgent(assignedAgentData);
                        setCurrentSession((prev) => ({
                            ...prev,
                            assigned_to: assignedAgentData?.id,
                            assignedTo: assignedAgentData,
                        }));
                        setShowAssignModal(false);

                        // Update sessions list
                        setSessions((prevSessions) =>
                            prevSessions.map((session) => {
                                if (
                                    session.session_id ===
                                    currentSession.session_id
                                ) {
                                    return {
                                        ...session,
                                        assigned_to: assignedAgentData?.id,
                                        assignedTo: assignedAgentData,
                                    };
                                }
                                return session;
                            })
                        );

                        setTimeout(() => {
                            router.reload({
                                only: ["sessions"],
                                preserveState: true,
                                preserveScroll: true,
                            });
                        }, 100);
                    },
                    onError: (errors) => {
                        console.error("Error assigning conversation:", errors);
                    },
                }
            );
        }
    };

    const handleTakeConversation = () => {
        if (!currentSession) return;

        router.post(
            route("chat.take", currentSession.session_id),
            {},
            {
                onSuccess: (response) => {
                    const currentUser = {
                        id: auth.user.id,
                        name: auth.user.name,
                        email: auth.user.email,
                    };

                    console.log(
                        "Take conversation success, updating states with:",
                        currentUser
                    );

                    setCurrentAssignedAgent(currentUser);
                    setCurrentSession((prev) => ({
                        ...prev,
                        assigned_to: auth.user.id,
                        assignedTo: currentUser,
                    }));

                    // Update the sessions list to reflect the assignment
                    setSessions((prevSessions) =>
                        prevSessions.map((session) => {
                            if (
                                session.session_id === currentSession.session_id
                            ) {
                                return {
                                    ...session,
                                    assigned_to: auth.user.id,
                                    assignedTo: currentUser,
                                };
                            }
                            return session;
                        })
                    );

                    // Force a fresh reload of sessions data to ensure backend sync
                    setTimeout(() => {
                        router.reload({
                            only: ["sessions"],
                            preserveState: true,
                            preserveScroll: true,
                        });
                    }, 100);
                },
                onError: (errors) => {
                    console.error("Error taking conversation:", errors);
                },
            }
        );
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
        if (!timestamp) return "Unknown";

        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // Today
        if (diffDays === 0) {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, "0");
            return `Today ${displayHours}:${displayMinutes} ${ampm}`;
        }
        // Yesterday
        else if (diffDays === 1) {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, "0");
            return `Yesterday ${displayHours}:${displayMinutes} ${ampm}`;
        }
        // This week (within 7 days)
        else if (diffDays <= 7) {
            const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? "PM" : "AM";
            const displayHours = hours % 12 || 12;
            const displayMinutes = minutes.toString().padStart(2, "0");
            return `${
                weekdays[date.getDay()]
            } ${displayHours}:${displayMinutes} ${ampm}`;
        }
        // Older dates
        else {
            const months = [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ];
            return `${months[date.getMonth()]} ${date.getDate()}`;
        }
    };

    const headWeb = "Conversations";
    const linksBreadcrumb = [
        { title: "Home", url: "/" },
        { title: headWeb, url: "" },
    ];

    return (
        <AdminLayout
            breadcrumb={<Breadcrumb header={headWeb} links={linksBreadcrumb} />}
        >
            <Head title="Chat Support" />

            {/* Two-Panel Layout with Better Spacing */}
            <div className="flex h-screen bg-gray-100 p-4 gap-4">
                {/* Left Panel - Sessions List */}
                <div className="w-1/3 bg-white border border-gray-300 rounded-xl flex flex-col shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">
                                    Conversations
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Manage customer chats
                                </p>
                            </div>

                            {/* Assignment Stats */}
                            {assignmentStats && (
                                <div className="flex space-x-2">
                                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                                        <div className="text-lg font-bold text-blue-600">
                                            {assignmentStats.total || 0}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            Total
                                        </div>
                                    </div>
                                    <div className="text-center p-2 bg-orange-50 rounded-lg">
                                        <div className="text-lg font-bold text-orange-600">
                                            {assignmentStats.pending || 0}
                                        </div>
                                        <div className="text-xs text-orange-600">
                                            Pending
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search and Filters */}
                        <div className="space-y-3">
                            <div className="relative">
                                <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search by user name..."
                                    value={search}
                                    onChange={handleSearchChange}
                                    autoComplete="off"
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                />
                                {isFiltering && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                    </div>
                                )}
                                {search && !isFiltering && (
                                    <button
                                        onClick={clearFilters}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center transition-colors"
                                        title="Clear search"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>

                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        handleStatusChange(e.target.value)
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="answered">Answered</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Sessions List */}
                    <div className="flex-1 overflow-y-auto">
                        <div
                            className={`divide-y divide-gray-200 transition-opacity duration-200 ${
                                isFiltering ? "opacity-50" : "opacity-100"
                            }`}
                        >
                            {Array.isArray(filteredSessions) &&
                                filteredSessions.map((session) => (
                                    <div
                                        key={session.session_id}
                                        onClick={() =>
                                            handleSessionSelect(session)
                                        }
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                                            currentSession?.session_id ===
                                            session.session_id
                                                ? "bg-blue-50 border-r-4 border-r-blue-500"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm relative ${
                                                    session.status === "pending"
                                                        ? "bg-gradient-to-br from-orange-400 to-orange-600"
                                                        : session.status ===
                                                          "answered"
                                                        ? "bg-gradient-to-br from-green-400 to-green-600"
                                                        : "bg-gradient-to-br from-gray-400 to-gray-600"
                                                }`}
                                            >
                                                {(session.user_name || "U")
                                                    .charAt(0)
                                                    .toUpperCase()}
                                                {/* Assignment status indicator */}
                                                {session.assignedTo && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <AiOutlineUser className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                                                        {session.user_name ||
                                                            "Anonymous User"}
                                                    </h3>
                                                    {session.unread_count >
                                                        0 && (
                                                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                                            {
                                                                session.unread_count
                                                            }
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-gray-500 truncate mb-1 flex items-center">
                                                    <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center mr-2">
                                                        <AiOutlineMail className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                    {session.user_email ||
                                                        "No email provided"}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                        {formatTime(
                                                            session.last_message_time
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {/* Empty State (improved like Shop.jsx) */}
                            {!isFiltering &&
                                (!Array.isArray(filteredSessions) ||
                                    filteredSessions.length === 0) && (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AiOutlineMessage className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                            {search || statusFilter !== "all"
                                                ? "No conversations found"
                                                : "No conversations yet"}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-6">
                                            {search || statusFilter !== "all"
                                                ? "Try adjusting your search or filter criteria."
                                                : "When customers start chatting, their conversations will appear here."}
                                        </p>
                                        {(search || statusFilter !== "all") && (
                                            <button
                                                onClick={clearFilters}
                                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                                            >
                                                Clear All Filters
                                            </button>
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>

                {/* Right Panel - Chat Show */}
                <div className="flex-1 bg-white border border-gray-300 rounded-xl shadow-sm overflow-hidden">
                    {currentSession ? (
                        <ChatShow
                            sessionId={currentSession.session_id}
                            sessionInfo={currentSession}
                            messages={currentMessages}
                            onStatusUpdate={handleStatusUpdate}
                            onDeleteConversation={handleDeleteConversation}
                            headerContent={
                                <div className="flex items-center space-x-3">
                                    {/* Assignment Controls */}
                                    {!currentAssignedAgent ? (
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={handleTakeConversation}
                                                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                Take Conversation
                                            </button>
                                            <button
                                                onClick={() =>
                                                    setShowAssignModal(true)
                                                }
                                                className="px-4 py-2 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() =>
                                                setShowAssignModal(true)
                                            }
                                            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                        >
                                            Reassign
                                        </button>
                                    )}
                                </div>
                            }
                            className="h-full"
                        />
                    ) : (
                        /* No Session Selected */
                        <div className="flex-1 flex items-center justify-center bg-gray-50 h-full">
                            <div className="text-center max-w-md mx-auto px-6">
                                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <AiOutlineMessage className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                    Select a conversation
                                </h3>
                                <p className="text-gray-500 leading-relaxed">
                                    Choose a conversation from the sidebar to
                                    view messages and reply
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Assignment Modal */}
            {showAssignModal && currentSession && (
                <div className="fixed inset-0 backdrop-blur-xl flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 m-4 max-w-md w-full shadow-2xl">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <AiOutlineUser className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {currentAssignedAgent
                                        ? "Reassign"
                                        : "Assign"}{" "}
                                    Conversation
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Choose an agent for this conversation
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            {availableAgents.map((agent) => (
                                <button
                                    key={agent.id}
                                    onClick={() => handleAssignAgent(agent.id)}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-semibold text-sm">
                                                {agent.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {agent.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {agent.email}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            <div className="border-t border-gray-200 pt-3 space-y-2">
                                <button
                                    onClick={() => handleAssignAgent("auto")}
                                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-green-600 font-semibold text-sm">
                                                🤖
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                Auto Assign
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Automatically assign to
                                                available agent
                                            </p>
                                        </div>
                                    </div>
                                </button>

                                {currentAssignedAgent && (
                                    <button
                                        onClick={() =>
                                            handleAssignAgent("unassign")
                                        }
                                        className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                <span className="text-red-600 font-semibold text-sm">
                                                    ❌
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Unassign
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Remove current assignment
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
