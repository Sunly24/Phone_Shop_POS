import AdminLayout from "@/Layouts/AdminLayout";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import { Head } from "@inertiajs/react";
import DeleteUserForm from "./Partials/DeleteUserForm";
import UpdatePasswordForm from "./Partials/UpdatePasswordForm";
import UpdateProfileInformationForm from "./Partials/UpdateProfileInformationForm";
import TwoFactorAuthenticationForm from "./Partials/TwoFactorAuthenticationForm";
import LogoutOtherBrowserSessionsForm from "./Partials/LogoutOtherBrowserSessionsForm";
import { useState } from "react";

export default function Edit({ auth, mustVerifyEmail, status, sessions }) {
    // Check if user has admin permissions (any admin permission means they can access admin layout)
    const canAccessAdmin =
        auth?.can &&
        Object.values(auth.can).some((permission) => permission === true);
    const Layout = canAccessAdmin ? AdminLayout : AuthenticatedLayout;
    const [activeTab, setActiveTab] = useState("profile"); // Default to profile tab

    const tabs = [
        { id: "profile", label: "Profile Information", icon: "fas fa-user" },
        { id: "password", label: "Password", icon: "fas fa-lock" },
        {
            id: "2fa",
            label: "Two-Factor Auth",
            icon: "fas fa-shield-alt",
        },
        { id: "sessions", label: "Browser Sessions", icon: "fas fa-laptop" },
        {
            id: "delete",
            label: "Delete Account",
            icon: "fas fa-trash",
            isDanger: true,
        },
    ];

    const headWeb = "Profile Settings";
    const linksBreadcrumb = [
        { title: "Home", url: "/dashboard" },
        { title: headWeb, url: "" },
    ];

    // Create layout props conditionally
    const layoutProps = canAccessAdmin
        ? {
              breadcrumb: (
                  <Breadcrumb header={headWeb} links={linksBreadcrumb} />
              ),
          }
        : {
              header: (
                  <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                      Profile
                  </h2>
              ),
          };

    return (
        <Layout {...layoutProps}>
            <Head title="Profile" />

            <div className="bg-gray-50 min-h-screen py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                        {/* Left Sidebar */}
                        <div className="lg:col-span-3 space-y-6">
                            {/* Profile Information Card */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600">
                                    <div className="flex flex-col items-center">
                                        <div className="relative">
                                            <div className="w-24 h-24 rounded-full bg-white shadow-lg p-1">
                                                <img
                                                    src={
                                                        auth.user.avatar_url ||
                                                        auth.user
                                                            .profile_photo_url ||
                                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                            auth.user.name
                                                        )}&color=7F9CF5&background=EBF4FF`
                                                    }
                                                    alt="Profile"
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                        </div>
                                        <h3 className="mt-4 text-xl font-semibold text-white text-center">
                                            {auth.user.name}
                                        </h3>
                                        <p className="text-blue-100 text-sm text-center">
                                            {auth.user.email}
                                        </p>
                                        <span className="mt-2 px-3 py-1 bg-blue-400 bg-opacity-50 text-white text-xs rounded-full">
                                            {auth.user.roles?.[0]?.name ||
                                                "User"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Tabs Card */}
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <nav className="p-4 space-y-1">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                                                ${
                                                    activeTab === tab.id
                                                        ? tab.isDanger
                                                            ? "bg-red-50 text-red-600 border-l-4 border-red-500"
                                                            : "bg-blue-50 text-blue-600 border-l-4 border-blue-500"
                                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                }
                                            `}
                                        >
                                            <span className="mr-3 text-lg">
                                                <i className={tab.icon}></i>
                                            </span>
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="mt-8 lg:mt-0 lg:col-span-9">
                            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                                {/* Content Header */}
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {
                                            tabs.find(
                                                (tab) => tab.id === activeTab
                                            )?.label
                                        }
                                    </h2>
                                </div>

                                {/* Content Body */}
                                <div className="p-6">
                                    {activeTab === "profile" && (
                                        <UpdateProfileInformationForm
                                            mustVerifyEmail={mustVerifyEmail}
                                            status={status}
                                            className="w-full"
                                        />
                                    )}

                                    {activeTab === "password" && (
                                        <UpdatePasswordForm className="w-full" />
                                    )}

                                    {activeTab === "2fa" && (
                                        <TwoFactorAuthenticationForm className="w-full" />
                                    )}

                                    {activeTab === "sessions" &&
                                        sessions?.length > 0 && (
                                            <LogoutOtherBrowserSessionsForm
                                                sessions={sessions}
                                                className="w-full"
                                            />
                                        )}

                                    {activeTab === "delete" && (
                                        <DeleteUserForm className="w-full" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
