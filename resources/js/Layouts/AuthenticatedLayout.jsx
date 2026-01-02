import ResponsiveNavLink from "@/Components/ResponsiveNavLink";
import NotificationDropdown from "@/Components/NotificationDropdown";
import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Handle dropdown click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            {/* Custom styles for modern dropdown */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                /* Modern dropdown styling */
                .dropdown-menu {
                    border: none !important;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
                }
                
                .dropdown-item:hover {
                    background-color: #f8f9fa !important;
                    color: inherit !important;
                }
                
                .dropdown-item:focus {
                    background-color: #f8f9fa !important;
                    color: inherit !important;
                }
                
                /* Smooth animations */
                .dropdown-menu {
                    animation: dropdownFadeIn 0.15s ease-out;
                }
                
                @keyframes dropdownFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                /* User name in navbar - responsive */
                @media (max-width: 767px) {
                    .d-none.d-md-inline {
                        display: none !important;
                    }
                }
                `,
                }}
            />
            <div className="min-h-screen bg-gray-100">
                <nav className="border-b border-gray-100 bg-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 justify-between">
                            <div className="flex">
                                <div className="flex shrink-0 items-center">
                                    <Link
                                        href="/"
                                        className="flex items-center"
                                    >
                                        <img
                                            src="/images/brand-logo/blue-logo.png"
                                            alt="Phone Store Logo"
                                            className="h-10 w-auto"
                                            style={{
                                                objectFit: "contain",
                                                borderRadius: "8px",
                                                backgroundColor: "white",
                                                padding: "4px",
                                            }}
                                        />
                                        <span className="ml-3 text-lg font-semibold text-gray-800">
                                            PHONE STORE
                                        </span>
                                    </Link>
                                </div>
                            </div>

                            <div className="hidden sm:ms-6 sm:flex sm:items-center">
                                <div className="relative mr-4">
                                    <NotificationDropdown />
                                </div>

                                {/* User Dropdown */}
                                <div className="relative" ref={dropdownRef}>
                                    <div className="dropdown">
                                        <button
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none transition ease-in-out duration-150"
                                            type="button"
                                            onClick={() =>
                                                setShowDropdown(!showDropdown)
                                            }
                                            aria-expanded={showDropdown}
                                            style={{ padding: "0.5rem" }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white shadow mr-2">
                                                <img
                                                    src={user.profile_photo_url}
                                                    className="w-full h-full rounded-full object-cover"
                                                    alt={user.name}
                                                />
                                            </div>
                                            <span className="hidden md:inline font-medium text-gray-800">
                                                {user.name}
                                            </span>
                                            <svg
                                                className="ml-2 -mr-0.5 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>

                                        {showDropdown && (
                                            <div
                                                className="dropdown-menu dropdown-menu-end shadow-lg border-0"
                                                style={{
                                                    minWidth: "280px",
                                                    borderRadius: "12px",
                                                    position: "absolute",
                                                    right: "0",
                                                    top: "100%",
                                                    zIndex: "1000",
                                                    display: "block",
                                                    backgroundColor: "white",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                {/* User Info Header */}
                                                <div className="px-4 py-3 border-b border-gray-200">
                                                    <h6 className="mb-1 font-semibold text-gray-900">
                                                        {user.name}
                                                    </h6>
                                                    <p className="mb-0 text-sm text-gray-500">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="py-2">
                                                    <Link
                                                        href={route(
                                                            "profile.edit"
                                                        )}
                                                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                                    >
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mr-3">
                                                            <svg
                                                                className="w-4 h-4 text-blue-600"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <span>
                                                            Edit profile
                                                        </span>
                                                    </Link>
                                                </div>

                                                <div className="border-t border-gray-200 mx-3"></div>

                                                {/* Logout */}
                                                <div className="py-2">
                                                    <Link
                                                        href={route("logout")}
                                                        method="post"
                                                        as="button"
                                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                                    >
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 mr-3">
                                                            <svg
                                                                className="w-4 h-4 text-red-600"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <span>Sign out</span>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="-me-2 flex items-center sm:hidden">
                                <div className="relative mr-2">
                                    <NotificationDropdown />
                                </div>

                                <button
                                    onClick={() =>
                                        setShowingNavigationDropdown(
                                            (previousState) => !previousState
                                        )
                                    }
                                    className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                                >
                                    <svg
                                        className="h-6 w-6"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            className={
                                                !showingNavigationDropdown
                                                    ? "inline-flex"
                                                    : "hidden"
                                            }
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                        <path
                                            className={
                                                showingNavigationDropdown
                                                    ? "inline-flex"
                                                    : "hidden"
                                            }
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        className={
                            (showingNavigationDropdown ? "block" : "hidden") +
                            " sm:hidden"
                        }
                    >
                        <div className="space-y-1 pb-3 pt-2">
                            <ResponsiveNavLink
                                href={route("home")}
                                active={route().current("home")}
                            >
                                Home
                            </ResponsiveNavLink>
                        </div>

                        <div className="border-t border-gray-200 pb-1 pt-4">
                            <div className="px-4">
                                <div className="text-base font-medium text-gray-800">
                                    {user.name}
                                </div>
                                <div className="text-sm font-medium text-gray-500">
                                    {user.email}
                                </div>
                            </div>

                            <div className="mt-3 space-y-1">
                                <ResponsiveNavLink href={route("profile.edit")}>
                                    Profile
                                </ResponsiveNavLink>
                                <ResponsiveNavLink
                                    method="post"
                                    href={route("logout")}
                                    as="button"
                                >
                                    Log Out
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>
                </nav>

                {header && (
                    <header className="bg-white shadow">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main>{children}</main>
            </div>
        </>
    );
}
