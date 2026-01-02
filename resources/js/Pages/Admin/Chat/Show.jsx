import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, router } from "@inertiajs/react";
import { AiOutlineArrowLeft } from "react-icons/ai";
import ChatInterface from "@/Components/ChatInterface";

// Reusable ChatShow component for embedding in Index.jsx
export function ChatShow({
    messages: initialMessages,
    sessionId,
    sessionInfo,
    onStatusUpdate,
    onDeleteConversation,
    headerContent,
    className = "",
}) {
    const handleStatusUpdate = (newStatus) => {
        if (onStatusUpdate) {
            onStatusUpdate(newStatus);
        } else {
            router.put(route("chat.update-status", sessionId), {
                status: newStatus,
            });
        }
    };

    const handleDeleteConversation = () => {
        if (onDeleteConversation) {
            onDeleteConversation();
        } else {
            router.delete(route("chat.destroy", sessionId));
        }
    };

    return (
        <div className={`h-full ${className}`}>
            <ChatInterface
                sessionId={sessionId}
                sessionInfo={sessionInfo}
                initialMessages={initialMessages}
                onStatusUpdate={handleStatusUpdate}
                onDeleteConversation={handleDeleteConversation}
                showHeader={true}
                showInfoPanel={true}
                headerContent={headerContent}
                className="h-full"
            />
        </div>
    );
}

// Default export for standalone Show page
export default function Show({
    messages: initialMessages,
    sessionId,
    sessionInfo,
}) {
    const handleStatusUpdate = (newStatus) => {
        router.put(route("chat.update-status", sessionId), {
            status: newStatus,
        });
    };

    const handleDeleteConversation = () => {
        router.delete(route("chat.destroy", sessionId));
    };

    return (
        <AdminLayout>
            <Head
                title={`Chat - ${sessionInfo.user_name || "Anonymous User"}`}
            />

            <div className="h-screen flex flex-col bg-gray-100">
                {/* Back to Chat List Button */}
                <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
                    <Link
                        href={route("chat.index")}
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <AiOutlineArrowLeft className="w-5 h-5 mr-2" />
                        <span>Back to Chat List</span>
                    </Link>
                </div>

                {/* Chat Interface using ChatShow component */}
                <div className="flex-1 overflow-hidden">
                    <ChatShow
                        messages={initialMessages}
                        sessionId={sessionId}
                        sessionInfo={sessionInfo}
                        className="h-full"
                    />
                </div>
            </div>
        </AdminLayout>
    );
}
