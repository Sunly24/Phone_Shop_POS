import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Link } from "@inertiajs/react";
import { MdOutlinePayment } from "react-icons/md";
import {
    AiOutlineMessage,
    AiOutlineClose,
    AiOutlineSend,
    AiOutlineRobot,
    AiOutlineUser,
    AiOutlineMinus,
    AiOutlineSmile,
    AiOutlinePaperClip,
    AiOutlineClockCircle,
    AiOutlineProduct,
    AiFillShop,
    AiOutlineTool,
    AiOutlineContacts,
} from "react-icons/ai";

// Quick Questions Data Structure for Phone Shop
const QUICK_QUESTIONS = [
    {
        id: 1,
        question: "Where is your store located?",
        icon: <AiFillShop />,
        answer: "We're located at 123 Main Street, Downtown. Our shop is right next to the City Mall, with easy parking available. You can also find us on Google Maps by searching 'Jongban Store'.\n\nStore Address:\n📍 123 Main Street, Downtown",
        category: "location",
    },
    {
        id: 2,
        question: "What are your opening hours?",
        icon: <AiOutlineClockCircle />,
        answer: "We're open 7 days a week!\n\n📅 Monday - Friday: 9:00 AM - 8:00 PM\n📅 Saturday: 10:00 AM - 7:00 PM\n📅 Sunday: 11:00 AM - 6:00 PM\n\n Extended hours during holiday seasons!\n Call us at (+855) 123-4567 for any urgent inquiries.",
        category: "hours",
    },
    {
        id: 3,
        question: "What phones do you sell?",
        icon: <AiOutlineProduct />,
        answer: "We carry all the latest smartphones and accessories!\n\n📱 iPhone (all models)\n📱 Samsung Galaxy series\n📱 Google Pixel\n📱 OnePlus\n📱 Xiaomi & other brands\n\n✨ New & Refurbished options\n🛡️ All with warranty\n💳 Financing available.",
        category: "products",
    },
    {
        id: 4,
        question: "What payment methods do you accept?",
        icon: <MdOutlinePayment />,
        answer: "We accept cash and KHQR",
        category: "payment",
    },
    {
        id: 5,
        question: "Do you repair phones?",
        icon: <AiOutlineTool />,
        answer: "Yes! We offer comprehensive repair services:\n\n🔧 Screen replacement\n🔋 Battery replacement\n💧 Water damage repair\n🔊 Speaker/microphone fixes\n📷 Camera repairs\n⚡ Charging port repairs\n\n⏱️ Most repairs done same day\n🛡️ 90-day warranty on all repairs\n💰 Free diagnostics",
        category: "repair",
    },
    {
        id: 6,
        question: "How can I contact you?",
        icon: <AiOutlineContacts />,
        answer: "Get in touch with us easily:\n\n📞 Phone: (+855) 123-4567\n📧 Email: support@jongban.com\n💬 Live chat\n\n🌐 Visit our website: www.jongban.e-khmer.com\n📍 Walk-in: 123 Main Street, Downtown",
        category: "contact",
    },
];

const ChatSupport = ({ auth }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [activeTab, setActiveTab] = useState("chat"); // "chat" or "help"
    const [lastMessageId, setLastMessageId] = useState(null);
    const [isSending, setIsSending] = useState(false); // Prevent double sends

    // Quick Questions State
    const [showQuickQuestions, setShowQuickQuestions] = useState(true);
    const [answeredQuestions, setAnsweredQuestions] = useState(new Set());

    // Initialize user info from auth or empty for guests
    const [userInfo, setUserInfo] = useState(() => {
        if (auth?.user) {
            return {
                name: auth.user.name || "",
                email: auth.user.email || "",
                phone: auth.user.phone || "",
            };
        }
        return {
            name: "",
            email: "",
            phone: "",
        };
    });

    const isAuthenticated = auth?.user;

    const messagesEndRef = useRef(null);
    const optimisticCleanupRef = useRef(null);

    useEffect(() => {
        const cleanup = () => {
            setMessages((prev) => {
                const now = new Date();
                return prev.filter((msg) => {
                    if (!msg.isOptimistic) return true;

                    const messageAge = now - new Date(msg.timestamp);
                    return messageAge < 10000;
                });
            });
        };

        const interval = setInterval(cleanup, 30000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen && !sessionId) {
            initializeChat();
        }
    }, [isOpen]);

    const getBrowserSessionId = () => {
        let browserId = sessionStorage.getItem("chat_browser_id");
        if (!browserId) {
            browserId =
                "browser_" +
                Date.now() +
                "_" +
                Math.random().toString(36).substring(2);
            sessionStorage.setItem("chat_browser_id", browserId);
        }
        return browserId;
    };

    const getStorageKeys = (sessionId = null) => {
        const sessionKey = isAuthenticated
            ? "chat_session_id"
            : `chat_session_id_${getBrowserSessionId()}`;

        const messagesKey = sessionId
            ? isAuthenticated
                ? `chat_messages_${sessionId}`
                : `chat_messages_${sessionId}_${getBrowserSessionId()}`
            : null;

        return { sessionKey, messagesKey };
    };

    useEffect(() => {
        if (messages.length > 0 && sessionId) {
            const safeMessages = messages.map((msg) => ({
                ...msg,
                timestamp:
                    msg.timestamp instanceof Date
                        ? msg.timestamp.toISOString()
                        : typeof msg.timestamp === "string"
                        ? msg.timestamp
                        : new Date().toISOString(),
            }));

            const { messagesKey } = getStorageKeys(sessionId);

            localStorage.setItem(messagesKey, JSON.stringify(safeMessages));
        }
    }, [messages, sessionId, isAuthenticated]);

    useEffect(() => {
        if (!sessionId) return;

        let cleanupFunction = null;

        if (window.Echo) {
            try {
                const channel = window.Echo.channel(`chat.${sessionId}`);

                channel.listen(".message.sent", (e) => {
                    let timestamp;
                    try {
                        timestamp = new Date(e.created_at);
                        if (isNaN(timestamp.getTime())) {
                            throw new Error("Invalid date");
                        }
                    } catch (error) {
                        timestamp = new Date();
                    }

                    const newMessage = {
                        id: e.id,
                        text: e.message,
                        sender: e.sender,
                        timestamp: timestamp,
                    };

                    setMessages((prev) => {
                        const existingMessage = prev.find(
                            (m) => m.id === newMessage.id
                        );
                        if (existingMessage) {
                            return prev;
                        }

                        const filteredMessages = prev.filter((msg) => {
                            if (!msg.isOptimistic) return true;

                            if (
                                msg.sender === newMessage.sender &&
                                msg.text.trim() === newMessage.text.trim()
                            ) {
                                return false;
                            }

                            return true;
                        });

                        const newState = [...filteredMessages, newMessage];

                        setTimeout(() => {
                            scrollToBottom();
                        }, 100);

                        return newState;
                    });
                });

                channel.subscribed(() => {});

                channel.error((error) => {});

                cleanupFunction = () => {
                    try {
                        window.Echo.leaveChannel(`chat.${sessionId}`);
                    } catch (error) {
                        
                    }
                };
            } catch (error) {
                
            }
        }

        return () => {
            if (cleanupFunction) cleanupFunction();
        };
    }, [sessionId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleQuickQuestion = (questionData) => {
        const userMessage = {
            id: `quick-question-user-${Date.now()}`,
            text: questionData.question,
            sender: "user",
            timestamp: new Date(),
        };

        const supportResponse = {
            id: `quick-question-support-${Date.now()}`,
            text: questionData.answer,
            sender: "support",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage, supportResponse]);

        setAnsweredQuestions((prev) => new Set([...prev, questionData.id]));

        setTimeout(() => {
            scrollToBottom();
        }, 100);
    };

    const getAvailableQuestions = () => {
        return QUICK_QUESTIONS;
    };

    const initializeChat = async () => {
        try {
            const { sessionKey: storageKey } = getStorageKeys();

            const storedSessionId = localStorage.getItem(storageKey);

            let newSessionId;

            if (storedSessionId) {
                try {
                    const sessionCheckResponse = await axios.get(
                        `/api/chat/check-session/${storedSessionId}`
                    );

                    if (!sessionCheckResponse.data.exists) {
                        localStorage.removeItem(storageKey);
                        const { messagesKey } = getStorageKeys(storedSessionId);
                        localStorage.removeItem(messagesKey);
                        throw new Error(
                            "Session not found in database or access denied"
                        );
                    }

                    try {
                        const { messagesKey } = getStorageKeys(storedSessionId);
                        const cachedMessages =
                            localStorage.getItem(messagesKey);
                        if (cachedMessages) {
                            try {
                                const parsedMessages =
                                    JSON.parse(cachedMessages);
                                if (
                                    parsedMessages &&
                                    parsedMessages.length > 0
                                ) {
                                    setMessages(
                                        parsedMessages.map((msg) => {
                                            try {
                                                return {
                                                    ...msg,
                                                    timestamp: new Date(
                                                        msg.timestamp
                                                    ),
                                                };
                                            } catch (error) {
                                                return {
                                                    ...msg,
                                                    timestamp: new Date(),
                                                };
                                            }
                                        })
                                    );
                                    setSessionId(storedSessionId);

                                    const messagesResponse = await axios.get(
                                        `/api/chat/messages/${storedSessionId}`
                                    );
                                    if (
                                        messagesResponse.data.messages &&
                                        messagesResponse.data.messages.length >
                                            0
                                    ) {
                                        const serverMessages =
                                            messagesResponse.data.messages.map(
                                                (msg) => {
                                                    try {
                                                        return {
                                                            id: msg.id,
                                                            text: msg.message,
                                                            sender: msg.sender,
                                                            timestamp: new Date(
                                                                msg.created_at
                                                            ),
                                                        };
                                                    } catch (error) {
                                                        return {
                                                            id: msg.id,
                                                            text: msg.message,
                                                            sender: msg.sender,
                                                            timestamp:
                                                                new Date(),
                                                        };
                                                    }
                                                }
                                            );

                                        const welcomeMessage =
                                            parsedMessages.find(
                                                (msg) =>
                                                    typeof msg.id ===
                                                        "string" &&
                                                    msg.id.includes("welcome")
                                            );

                                        const allMessages = welcomeMessage
                                            ? [
                                                  welcomeMessage,
                                                  ...serverMessages,
                                              ]
                                            : serverMessages;

                                        setMessages(
                                            allMessages.sort(
                                                (a, b) =>
                                                    new Date(a.timestamp) -
                                                    new Date(b.timestamp)
                                            )
                                        );
                                    }
                                    return;
                                }
                            } catch (e) {}
                        }

                        const messagesResponse = await axios.get(
                            `/api/chat/messages/${storedSessionId}`
                        );

                        if (
                            messagesResponse.data.messages &&
                            messagesResponse.data.messages.length > 0
                        ) {
                            newSessionId = storedSessionId;
                            const existingMessages =
                                messagesResponse.data.messages.map((msg) => {
                                    try {
                                        return {
                                            id: msg.id,
                                            text: msg.message,
                                            sender: msg.sender,
                                            timestamp: new Date(msg.created_at),
                                        };
                                    } catch (error) {
                                        return {
                                            id: msg.id,
                                            text: msg.message,
                                            sender: msg.sender,
                                            timestamp: new Date(),
                                        };
                                    }
                                });
                            setMessages(existingMessages);
                            setSessionId(newSessionId);
                            return;
                        }
                    } catch (error) {
                        localStorage.removeItem("chat_session_id");
                        localStorage.removeItem(
                            `chat_messages_${storedSessionId}`
                        );
                    }
                } catch (error) {
                    localStorage.removeItem("chat_session_id");
                    localStorage.removeItem(`chat_messages_${storedSessionId}`);
                }
            }

            const response = await axios.post("/api/chat/session");
            newSessionId = response.data.session_id;
            setSessionId(newSessionId);

            const { sessionKey: newStorageKey } = getStorageKeys();
            localStorage.setItem(newStorageKey, newSessionId);

            // Set initial welcome message (personalized for authenticated users)
            const welcomeText = isAuthenticated
                ? `Hi ${auth.user.name}, thanks for reaching out!\n\nTry our quick questions below for instant answers, or if you encounter any issues, we recommend first visiting our help center, where you will find detailed articles and frequently asked questions that may help you quickly find a solution.\n\nIf you need further assistance, feel free to contact us.\n\nOur customer service hours are Monday to Friday, from 9:00 AM to 8:00 PM (EST). Responses outside of these hours may be delayed.\n\nThank you for your understanding and support.`
                : "Hi, thanks for reaching out!\n\nWe are delighted to assist you. Try our quick questions below for instant answers, or if you encounter any issues, we recommend first visiting our help center, where you will find detailed articles and frequently asked questions that may help you quickly find a solution.\n\nIf you need further assistance, feel free to contact us.\n\nOur customer service hours are Monday to Friday, from 9:00 AM to 8:00 PM (EST). Responses outside of these hours may be delayed.\n\nThank you for your understanding and support.";

            setMessages([
                {
                    id: "welcome-message",
                    text: welcomeText,
                    sender: "support",
                    timestamp: new Date(),
                },
            ]);
        } catch (error) {
            
            const fallbackText = isAuthenticated
                ? `Welcome to Jongban Support, ${auth.user.name}! Please note that there may be connectivity issues. You can still send us a message and we'll get back to you as soon as possible. Try our quick questions below for instant answers!`
                : "Welcome to Jongban Support! Please note that there may be connectivity issues. You can still send us a message and we'll get back to you as soon as possible. Try our quick questions below for instant answers!";

            setMessages([
                {
                    id: "welcome-fallback",
                    text: fallbackText,
                    sender: "support",
                    timestamp: new Date(),
                },
            ]);
        }
    };

    const handleSendMessage = async () => {
        if (inputMessage.trim() === "" || isSending) return;

        if (!isAuthenticated) {
            setShowLoginPrompt(true);
            return;
        }

        setIsSending(true);
        const messageText = inputMessage.trim();
        setInputMessage("");
        setIsTyping(true);

        const tempId = `temp-${Date.now()}-${Math.random()}`;
        const contentHash = btoa(messageText).substring(0, 10);

        const optimisticMessage = {
            id: tempId,
            text: messageText,
            sender: "user",
            timestamp: new Date(),
            isOptimistic: true,
            contentHash: contentHash,
        };

        setMessages((prev) => [...prev, optimisticMessage]);

        try {
            const response = await axios.post("/api/chat/message", {
                session_id: sessionId,
                message: messageText,
                sender: "user",
                user_name: auth.user.name,
                user_email: auth.user.email,
                user_phone: auth.user.phone || "",
                user_id: auth.user.id,
            });

            setTimeout(() => {
                setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
            }, 5000);
        } catch (error) {
            
            setMessages((prev) => prev.filter((msg) => msg.id !== tempId));

            // setNotification("Failed to send message. Please try again.");
        } finally {
            setIsTyping(false);
            setIsSending(false); // Re-enable sending
        }
    };

    const handleTextareaChange = (e) => {
        const value = e.target.value;
        setInputMessage(value);

        // Auto-resize textarea
        e.target.style.height = "36px";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey && !isSending) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-3 sm:bottom-4 md:bottom-6 right-3 sm:right-4 md:right-6 bg-blue-600 hover:bg-blue-700 text-white p-2 sm:p-3 md:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50"
                >
                    <AiOutlineMessage className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                </button>
            )}

            {/* Login Prompt Modal */}
            {showLoginPrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white rounded-lg p-4 sm:p-6 m-3 sm:m-4 max-w-sm sm:max-w-md w-full">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                            Login Required
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                            Please login or register to continue with the chat
                            support.
                        </p>
                        <div className="flex space-x-2 sm:space-x-3 pt-3 sm:pt-4">
                            <button
                                type="button"
                                onClick={() => setShowLoginPrompt(false)}
                                className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <Link
                                href="/login"
                                className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                            >
                                Login
                            </Link>
                            <Link
                                href="/register"
                                className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-center text-sm"
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-2 sm:bottom-6 right-2 sm:right-6 w-full sm:w-full md:w-96 h-[75vh] sm:h-[80vh] md:h-[750px] max-h-[750px] bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden mx-2 sm:mx-4 md:mx-0 max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)] md:max-w-md">
                    {/* Header with Tabs */}
                    <div className=" text-black rounded-t-xl sm:rounded-t-2xl">
                        {" "}
                        {/* Tabs */}
                        <div className="flex p-1">
                            <button
                                onClick={() => setActiveTab("chat")}
                                className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium flex items-center justify-center space-x-1 sm:space-x-2 rounded-lg mx-1 transition-colors ${
                                    activeTab === "chat"
                                        ? "bg-blue-600 text-white"
                                        : "text-blue-600 hover:text-white hover:bg-blue-600"
                                }`}
                            >
                                <AiOutlineMessage className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Chat</span>
                            </button>
                            <button
                                onClick={() => setActiveTab("help")}
                                className={`flex-1 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium flex items-center justify-center space-x-1 sm:space-x-2 rounded-lg mx-1 transition-colors ${
                                    activeTab === "help"
                                        ? "bg-blue-600 text-white"
                                        : "text-blue-600 hover:text-white hover:bg-blue-600"
                                }`}
                            >
                                <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span>Help</span>
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-2 sm:px-3 py-2 sm:py-3 text-blue-600 hover:bg-gray-100 rounded-lg mx-1 transition-colors"
                            >
                                <AiOutlineClose className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                        {/* Agent Info - Only show on chat tab */}
                        {activeTab === "chat" && (
                            <div className="px-2 sm:px-4 py-1 sm:py-2 flex justify-center">
                                <div className="inline-flex items-center space-x-1 sm:space-x-2 bg-white rounded-full shadow-md px-2 sm:px-3 py-1 sm:py-2 border border-gray-100">
                                    {/* Agent Avatar */}
                                    <div className="w-4 sm:w-5 md:w-6 h-4 sm:h-5 md:h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                                        <div className="w-2.5 sm:w-3 md:w-4 h-2.5 sm:h-3 md:h-4 bg-white rounded-full flex items-center justify-center">
                                            <div className="w-1 sm:w-1.5 md:w-2 h-1 sm:h-1.5 md:h-2 bg-green-500 rounded-full"></div>
                                        </div>
                                    </div>

                                    {/* Agent Info */}
                                    <span className="font-medium text-gray-900 text-xs sm:text-sm whitespace-nowrap">
                                        Jongban Support
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Content Area */}
                            {activeTab === "chat" ? (
                                <>
                                    {" "}
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1 sm:space-y-2">
                                        {messages.map((message, index) => {
                                            const isUser =
                                                message.sender === "user";
                                            const prevMessage =
                                                index > 0
                                                    ? messages[index - 1]
                                                    : null;
                                            const nextMessage =
                                                index < messages.length - 1
                                                    ? messages[index + 1]
                                                    : null;
                                            const isFirstInGroup =
                                                !prevMessage ||
                                                prevMessage.sender !==
                                                    message.sender;
                                            const isLastInGroup =
                                                !nextMessage ||
                                                nextMessage.sender !==
                                                    message.sender;

                                            return (
                                                <div key={message.id}>
                                                    {/* Show timestamp for first message in group */}
                                                    {isFirstInGroup && (
                                                        <div className="flex justify-center mb-1 sm:mb-2">
                                                            <span className="text-xs text-gray-500 bg-white/60 px-2 py-1 rounded-full shadow-md">
                                                                {message.timestamp instanceof
                                                                Date
                                                                    ? message.timestamp.toLocaleTimeString(
                                                                          [],
                                                                          {
                                                                              hour: "2-digit",
                                                                              minute: "2-digit",
                                                                          }
                                                                      )
                                                                    : typeof message.timestamp ===
                                                                      "string"
                                                                    ? new Date(
                                                                          message.timestamp
                                                                      ).toLocaleTimeString(
                                                                          [],
                                                                          {
                                                                              hour: "2-digit",
                                                                              minute: "2-digit",
                                                                          }
                                                                      )
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Message bubble */}
                                                    <div
                                                        className={`flex ${
                                                            isUser
                                                                ? "justify-end"
                                                                : "justify-start"
                                                        } mb-1`}
                                                    >
                                                        <div
                                                            className={`flex items-end max-w-[75%] ${
                                                                isUser
                                                                    ? ""
                                                                    : "space-x-1 sm:space-x-2"
                                                            }`}
                                                        >
                                                            {/* Avatar - only show for last message in group for support messages */}
                                                            {!isUser &&
                                                                isLastInGroup && (
                                                                    <div className="w-5 sm:w-6 h-5 sm:h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                                                                        <div className="w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full flex items-center justify-center">
                                                                            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-green-500 rounded-full"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            {!isUser &&
                                                                !isLastInGroup && (
                                                                    <div className="w-5 sm:w-6 h-5 sm:h-6 flex-shrink-0"></div>
                                                                )}

                                                            {/* Message content */}
                                                            <div
                                                                className={`px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm ${
                                                                    isUser
                                                                        ? `bg-blue-500 text-white rounded-xl sm:rounded-2xl`
                                                                        : `bg-white text-gray-800 border border-gray-200 rounded-xl sm:rounded-2xl`
                                                                }`}
                                                            >
                                                                <p className="text-xs sm:text-sm leading-snug whitespace-pre-line">
                                                                    {
                                                                        message.text
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Typing indicator */}
                                        {isTyping && (
                                            <div className="flex justify-start mb-2">
                                                <div className="flex items-end space-x-1 sm:space-x-2">
                                                    <div className="w-5 sm:w-6 h-5 sm:h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                                                        <div className="w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full flex items-center justify-center">
                                                            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-green-500 rounded-full"></div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white border border-gray-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-sm">
                                                        <div className="flex space-x-1">
                                                            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                                            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div ref={messagesEndRef} />
                                    </div>
                                    {/* Persistent Quick Questions at bottom of chat */}
                                    {showQuickQuestions &&
                                        getAvailableQuestions().length > 0 && (
                                            <div className="border-t border-gray-200 bg-gray-50/50 p-1.5 sm:p-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-xs font-medium text-gray-600 flex items-center"></h4>
                                                    <button
                                                        onClick={() =>
                                                            setShowQuickQuestions(
                                                                false
                                                            )
                                                        }
                                                        className="text-gray-600 hover:text-gray-800 text-xs sm:text-sm transition-colors"
                                                    >
                                                        Hide
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                                    {getAvailableQuestions()
                                                        .slice(0, 6)
                                                        .map((questionData) => (
                                                            <button
                                                                key={
                                                                    questionData.id
                                                                }
                                                                onClick={() =>
                                                                    handleQuickQuestion(
                                                                        questionData
                                                                    )
                                                                }
                                                                className={`text-left p-1.5 sm:p-2 rounded-md border text-xs transition-all duration-200 bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer`}
                                                                title={
                                                                    questionData.question
                                                                }
                                                            >
                                                                <div className="flex items-center justify-center">
                                                                    <span className="text-sm">
                                                                        {
                                                                            questionData.icon
                                                                        }
                                                                    </span>
                                                                    <span className="ml-1 text-gray-800 font-medium truncate">
                                                                        {
                                                                            questionData.category
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    {/* Show Quick Questions button when hidden */}
                                    {!showQuickQuestions && (
                                        <div className="border-t border-gray-200 bg-gray-50/50 p-1.5 sm:p-2">
                                            <button
                                                onClick={() =>
                                                    setShowQuickQuestions(true)
                                                }
                                                className="w-full text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-1"
                                            >
                                                <span>
                                                    Show Quick Questions
                                                </span>
                                            </button>
                                        </div>
                                    )}
                                    {/* Input Area */}
                                    <div className="border-t border-gray-200 bg-white p-2 sm:p-4">
                                        <div className="flex items-end space-x-2 sm:space-x-3">
                                            <div className="flex-1 relative">
                                                <textarea
                                                    value={inputMessage}
                                                    onChange={
                                                        handleTextareaChange
                                                    }
                                                    onKeyPress={handleKeyPress}
                                                    placeholder={
                                                        isAuthenticated
                                                            ? "Ask anything..."
                                                            : "Login to send a message..."
                                                    }
                                                    rows="1"
                                                    disabled={!isAuthenticated}
                                                    className={`w-full rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 pr-8 sm:pr-10 md:pr-12 text-xs sm:text-sm resize-none border-0 outline-none focus:outline-none ${
                                                        isAuthenticated
                                                            ? "bg-gray-100"
                                                            : "bg-gray-200 cursor-not-allowed"
                                                    }`}
                                                    style={{
                                                        minHeight: "32px",
                                                        maxHeight: "60px",
                                                    }}
                                                />
                                                {/* Send button appears inside textarea when there's content and user is authenticated */}
                                                {inputMessage.trim() !== "" &&
                                                    isAuthenticated && (
                                                        <button
                                                            onClick={
                                                                handleSendMessage
                                                            }
                                                            disabled={isSending}
                                                            className={`absolute right-2 sm:right-3 bottom-1.5 sm:bottom-2 text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl transition-colors duration-200 flex items-center justify-center shadow-sm hover:shadow-md ${
                                                                isSending
                                                                    ? "bg-gray-400 cursor-not-allowed"
                                                                    : "bg-blue-600 hover:bg-blue-700"
                                                            }`}
                                                            style={{
                                                                width: "28px",
                                                                height: "28px",
                                                            }}
                                                        >
                                                            <AiOutlineSend className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        </button>
                                                    )}
                                            </div>
                                        </div>

                                        {/* Login prompt or powered by section */}
                                        <div className="flex items-center justify-between mt-2 sm:mt-3">
                                            {!isAuthenticated ? (
                                                <div className="w-full">
                                                    <div className="text-center mb-2">
                                                        <p className="text-xs text-gray-600 mb-2">
                                                            Please login or
                                                            register to send
                                                            messages
                                                        </p>
                                                        <div className="flex space-x-2">
                                                            <Link
                                                                href="/login"
                                                                className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors text-center"
                                                            >
                                                                Login
                                                            </Link>
                                                            <Link
                                                                href="/register"
                                                                className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-800 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors text-center"
                                                            >
                                                                Register
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center space-x-2"></div>
                                                    <div className="text-xs text-gray-400 flex items-center space-x-1">
                                                        <span>We run on</span>
                                                        <span className="font-semibold text-blue-600 flex items-center space-x-1">
                                                            <span>Jongban</span>
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Help Tab Content */
                                <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50">
                                    <div className="space-y-3 sm:space-y-4">
                                        <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                                            Frequently Asked Questions
                                        </h3>

                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                                                <h4 className="font-medium text-gray-900 text-xs sm:text-sm">
                                                    How do I track my order?
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Learn how to check your
                                                    order status and tracking
                                                    information.
                                                </p>
                                            </div>

                                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                                                <h4 className="font-medium text-gray-900 text-xs sm:text-sm">
                                                    Return & Exchange Policy
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Information about our return
                                                    and exchange procedures.
                                                </p>
                                            </div>

                                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                                                <h4 className="font-medium text-gray-900 text-xs sm:text-sm">
                                                    Payment Methods
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    See all available payment
                                                    options for your orders.
                                                </p>
                                            </div>

                                            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                                                <h4 className="font-medium text-gray-900 text-xs sm:text-sm">
                                                    Product Warranty
                                                </h4>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    Learn about warranty
                                                    coverage for your phone
                                                    purchases.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                                            <button
                                                onClick={() =>
                                                    setActiveTab("chat")
                                                }
                                                className="w-full bg-blue-600 text-white py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                                            >
                                                Still need help? Start a chat
                                            </button>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-xs text-gray-500">
                                                Our support hours: Monday to
                                                Friday, 9:00 AM to 8:00 PM (EST)
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default ChatSupport;
