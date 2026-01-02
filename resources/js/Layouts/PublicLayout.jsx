import { Link, usePage } from "@inertiajs/react";
import SEO from "@/Components/SEO";
import { AiOutlineShoppingCart, AiOutlineMessage } from "react-icons/ai";
import ChatSupport from "@/Components/ChatSupport";
import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import CartDrawer from "@/Components/CartDrawer";
import { useDispatch } from "react-redux";
import { clearOrder } from "@/Pages/store/orderSlice";
import OrderHistory from "@/Components/OrderHistory";
import { FEATURED_BRANDS } from "@/constants/brands";

export default function PublicLayout({ children, seo = {} }) {
    const dispatch = useDispatch();
    const { auth } = usePage().props;
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const dropdownRef = useRef(null);

    // Open Cart
    const [cartOpen, setCartOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    // Handle dropdown click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setShowDropdown(false);
            }
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target) &&
                !event.target.closest("[data-mobile-menu-button]")
            ) {
                setShowMobileMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!auth?.user) {
            dispatch(clearOrder());
        }
    }, [auth?.user, dispatch]);

    const cartCount = useSelector((state) =>
        state.order.items.reduce((sum, item) => sum + item.quantity, 0)
    );

    const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);

    return (
        <>
            <SEO {...seo} />

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
                
                /* Modern navigation links */
                .nav-link {
                    position: relative;
                    transition: all 0.3s ease;
                }
                
                .nav-link::after {
                    content: '';
                    position: absolute;
                    width: 0;
                    height: 2px;
                    bottom: -2px;
                    left: 50%;
                    background: linear-gradient(90deg, #2563eb, #3b82f6);
                    transition: all 0.3s ease;
                    transform: translateX(-50%);
                }
                
                .nav-link:hover::after,
                .nav-link.active::after {
                    width: 100%;
                }
                
                .nav-link:hover {
                    transform: translateY(-1px);
                }

                .chat-support-widget, .chat-widget, .chat-bot, .chat-support-btn {
                    z-index: 40 !important;
                }
                `,
                }}
            />

            <div className="pt-16 min-h-[200vh] bg-gray-50">
                {/* Navigation */}
                <nav className="fixed top-0 left-0 w-full z-50 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <Link
                                    href="/"
                                    className="flex items-center mr-4 md:mr-8"
                                >
                                    <img
                                        src="/images/brand-logo/blue-logo.png"
                                        alt="Phone Shop"
                                        className="h-10 md:h-12 w-auto object-contain"
                                    />
                                </Link>
                                <div className="hidden md:flex items-center space-x-8">
                                    <Link
                                        href="/"
                                        className={`nav-link px-4 py-2 text-gray-700 hover:text-blue-600 font-medium ${
                                            route().current("home")
                                                ? "active text-blue-600"
                                                : ""
                                        }`}
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        href="/shop"
                                        className={`nav-link px-4 py-2 text-gray-700 hover:text-blue-600 font-medium ${
                                            route().current("public.shop")
                                                ? "active text-blue-600"
                                                : ""
                                        }`}
                                    >
                                        Shop
                                    </Link>
                                </div>
                            </div>

                            {/* Right side navigation */}
                            <div className="flex items-center space-x-4">
                                {/* Cart and Chat Support Icons */}
                                <div className="flex items-center space-x-3">
                                    {/* Cart Icon */}
                                    <button
                                        onClick={() => setCartOpen(true)}
                                        className="relative p-2 text-gray-700 hover:text-blue-600 transition"
                                    >
                                        <AiOutlineShoppingCart className="w-6 h-6" />
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                            {cartCount}
                                        </span>
                                    </button>
                                    <CartDrawer
                                        open={cartOpen}
                                        onClose={() => setCartOpen(false)}
                                    />
                                </div>

                                {auth?.user ? (
                                    <>
                                        {/* Desktop greeting and admin panel */}
                                        <div className="hidden md:flex items-center space-x-4">
                                            <span className="text-gray-600 hidden lg:block font-medium">
                                                Hello, {auth.user.name}
                                            </span>

                                            {/* Show admin link only for users with admin permissions */}
                                            {auth?.can &&
                                                Object.values(auth.can).some(
                                                    (permission) =>
                                                        permission === true
                                                ) && (
                                                    <Link
                                                        href="/dashboard"
                                                        className="hidden md:inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 mr-2"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                            />
                                                        </svg>
                                                        Admin Panel
                                                    </Link>
                                                )}
                                        </div>

                                        {/* User Avatar Dropdown - visible on all screen sizes */}
                                        <div
                                            className="relative"
                                            ref={dropdownRef}
                                        >
                                            <button
                                                onClick={() => {
                                                    setShowDropdown(
                                                        !showDropdown
                                                    );
                                                    // Close mobile menu if open
                                                    if (showMobileMenu) {
                                                        setShowMobileMenu(
                                                            false
                                                        );
                                                    }
                                                }}
                                                className="flex items-center space-x-1 md:space-x-2 p-1 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            >
                                                <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                                                    <img
                                                        src={
                                                            auth.user
                                                                .avatar_url ||
                                                            auth.user
                                                                .profile_photo_url
                                                        }
                                                        className="w-full h-full rounded-full object-cover border-2 border-white"
                                                        alt={auth.user.name}
                                                    />
                                                </div>
                                                <svg
                                                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 hidden md:block ${
                                                        showDropdown
                                                            ? "rotate-180"
                                                            : ""
                                                    }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </button>

                                            {showDropdown && (
                                                <div
                                                    className="absolute right-0 mt-2 bg-white rounded-xl shadow-xl border-0 z-50"
                                                    style={{
                                                        minWidth: "280px",
                                                        animation:
                                                            "dropdownFadeIn 0.15s ease-out",
                                                    }}
                                                >
                                                    {/* User Info Header */}
                                                    <div className="px-4 py-3 border-b border-gray-100">
                                                        <h6 className="mb-1 font-semibold text-gray-900">
                                                            {auth.user.name}
                                                        </h6>
                                                        <p className="mb-0 text-gray-500 text-sm">
                                                            {auth.user.email}
                                                        </p>
                                                    </div>

                                                    {/* Menu Items */}
                                                    <div className="py-2">
                                                        <Link
                                                            href="/profile"
                                                            className="flex items-center py-2 px-4 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                                            onClick={() =>
                                                                setShowDropdown(
                                                                    false
                                                                )
                                                            }
                                                        >
                                                            <div
                                                                className="rounded-full bg-gray-100 p-2 mr-3"
                                                                style={{
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                }}
                                                            >
                                                                <i
                                                                    className="fas fa-user text-blue-600"
                                                                    style={{
                                                                        fontSize:
                                                                            "0.875rem",
                                                                    }}
                                                                ></i>
                                                            </div>
                                                            <span className="text-gray-900">
                                                                Edit profile
                                                            </span>
                                                        </Link>

                                                        {/* Order History menu item */}
                                                        <button
                                                            onClick={() => {
                                                                setOrderHistoryOpen(
                                                                    true
                                                                );
                                                                setShowDropdown(
                                                                    false
                                                                );
                                                            }}
                                                            className="flex items-center py-2 px-4 text-gray-700 hover:bg-gray-50 transition-colors duration-150 w-full"
                                                            style={{
                                                                background:
                                                                    "none",
                                                                border: "none",
                                                            }}
                                                            type="button"
                                                        >
                                                            <div
                                                                className="rounded-full bg-gray-100 p-2 mr-3"
                                                                style={{
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                }}
                                                            >
                                                                <i
                                                                    className="fas fa-history text-blue-500"
                                                                    style={{
                                                                        fontSize:
                                                                            "0.875rem",
                                                                    }}
                                                                ></i>
                                                            </div>
                                                            <span className="text-gray-900">
                                                                Order history
                                                            </span>
                                                        </button>
                                                        <OrderHistory
                                                            open={
                                                                orderHistoryOpen
                                                            }
                                                            onClose={() =>
                                                                setOrderHistoryOpen(
                                                                    false
                                                                )
                                                            }
                                                        />

                                                        {/* Admin Panel -for mobile */}
                                                        {auth?.can &&
                                                            Object.values(
                                                                auth.can
                                                            ).some(
                                                                (permission) =>
                                                                    permission ===
                                                                    true
                                                            ) && (
                                                                <Link
                                                                    href="/dashboard"
                                                                    className="md:hidden flex items-center py-2 px-4 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                                                    onClick={() =>
                                                                        setShowDropdown(
                                                                            false
                                                                        )
                                                                    }
                                                                >
                                                                    <div
                                                                        className="rounded-full bg-gray-100 p-2 mr-3"
                                                                        style={{
                                                                            width: "32px",
                                                                            height: "32px",
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            justifyContent:
                                                                                "center",
                                                                        }}
                                                                    >
                                                                        <i
                                                                            className="fas fa-cog text-green-600"
                                                                            style={{
                                                                                fontSize:
                                                                                    "0.875rem",
                                                                            }}
                                                                        ></i>
                                                                    </div>
                                                                    <span className="text-gray-900">
                                                                        Admin
                                                                        Panel
                                                                    </span>
                                                                </Link>
                                                            )}
                                                    </div>

                                                    <div className="border-t border-gray-100 mx-3"></div>

                                                    {/* Logout */}
                                                    <div className="py-2">
                                                        <Link
                                                            href="/logout"
                                                            method="post"
                                                            className="flex items-center py-2 px-4 text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                                                            onClick={() =>
                                                                setShowDropdown(
                                                                    false
                                                                )
                                                            }
                                                        >
                                                            <div
                                                                className="rounded-full bg-gray-100 p-2 mr-3"
                                                                style={{
                                                                    width: "32px",
                                                                    height: "32px",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                }}
                                                            >
                                                                <i
                                                                    className="fas fa-sign-out-alt text-red-600"
                                                                    style={{
                                                                        fontSize:
                                                                            "0.875rem",
                                                                    }}
                                                                ></i>
                                                            </div>
                                                            <span className="text-gray-900">
                                                                Sign out
                                                            </span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    // Guest menu with modern design - hidden on mobile
                                    <div className="hidden md:flex items-center space-x-3">
                                        <Link
                                            href="/login"
                                            className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium border border-gray-300 rounded-lg hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                                        >
                                            Login
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                                        >
                                            Register
                                        </Link>
                                    </div>
                                )}

                                {/* Mobile menu button - positioned at the end */}
                                <button
                                    onClick={() => {
                                        setShowMobileMenu(!showMobileMenu);
                                        // Close avatar dropdown if open
                                        if (showDropdown) {
                                            setShowDropdown(false);
                                        }
                                    }}
                                    className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors ml-2"
                                    data-mobile-menu-button
                                >
                                    <span className="sr-only">
                                        Open main menu
                                    </span>
                                    {/* Hamburger icon */}
                                    <svg
                                        className={`${
                                            showMobileMenu ? "hidden" : "block"
                                        } h-6 w-6`}
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M4 6h16M4 12h16M4 18h16"
                                        />
                                    </svg>
                                    {/* Close icon */}
                                    <svg
                                        className={`${
                                            showMobileMenu ? "block" : "hidden"
                                        } h-6 w-6`}
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
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

                    {/* Mobile menu */}
                    <div
                        ref={mobileMenuRef}
                        className={`md:hidden transition-all duration-300 ease-in-out ${
                            showMobileMenu ? "block" : "hidden"
                        }`}
                    >
                        <div className="px-4 py-3 space-y-2 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                            {/* Navigation Links */}
                            <Link
                                href="/"
                                className={`block px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-white transition-all duration-200 font-medium ${
                                    route().current("home")
                                        ? "bg-blue-100 text-blue-600 shadow-sm"
                                        : ""
                                }`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                Home
                            </Link>
                            <Link
                                href="/shop"
                                className={`block px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-white transition-all duration-200 font-medium ${
                                    route().current("public.shop")
                                        ? "bg-blue-100 text-blue-600 shadow-sm"
                                        : ""
                                }`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                Shop
                            </Link>

                            {/* Authentication Section */}
                            {auth?.user ? (
                                // For authenticated users, only show navigation links in mobile menu
                                // Profile access is through the avatar dropdown which is always visible
                                <div className="pt-2 border-t border-gray-200 mt-2">
                                    <div className="px-4 py-2 text-sm text-gray-500">
                                        Signed in as {auth.user.name}
                                    </div>
                                </div>
                            ) : (
                                // Guest user options
                                <div className="pt-2 border-t border-gray-200 mt-2 space-y-2">
                                    <Link
                                        href="/login"
                                        className="block px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-white transition-all duration-200 font-medium border border-gray-300 text-center"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="block px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium text-center shadow-md"
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main>{children}</main>

                {/* Footer */}
                <footer className="bg-white text-gray-800 border-t border-gray-200">
                    <div className="max-w-7xl px-4 pt-3 sm:px-6 lg:px-8 justify-center">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Logo and Social Media - Left Side */}
                            <div className="lg:col-span-1">
                                <div className="mb-4">
                                    <img
                                        src="/images/brand-logo/blue-logo.png"
                                        alt="Phone Shop"
                                        className="h-32 w-auto object-contain"
                                    />
                                    <p className="text-gray-600 text-sm mb-4 max-w-md">
                                        Your trusted destination for the latest
                                        smartphones, accessories, and tech
                                        gadgets. Quality products at unbeatable
                                        prices.
                                    </p>
                                    <div className="flex space-x-4">
                                        <a
                                            href="https://facebook.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                x="0px"
                                                y="0px"
                                                width="36"
                                                height="36"
                                                viewBox="0 0 48 48"
                                            >
                                                <linearGradient
                                                    id="Ld6sqrtcxMyckEl6xeDdMa_uLWV5A9vXIPu_gr1"
                                                    x1="9.993"
                                                    x2="40.615"
                                                    y1="9.993"
                                                    y2="40.615"
                                                    gradientUnits="userSpaceOnUse"
                                                >
                                                    <stop
                                                        offset="0"
                                                        stop-color="#2aa4f4"
                                                    ></stop>
                                                    <stop
                                                        offset="1"
                                                        stop-color="#007ad9"
                                                    ></stop>
                                                </linearGradient>
                                                <path
                                                    fill="url(#Ld6sqrtcxMyckEl6xeDdMa_uLWV5A9vXIPu_gr1)"
                                                    d="M24,4C12.954,4,4,12.954,4,24s8.954,20,20,20s20-8.954,20-20S35.046,4,24,4z"
                                                ></path>
                                                <path
                                                    fill="#fff"
                                                    d="M26.707,29.301h5.176l0.813-5.258h-5.989v-2.874c0-2.184,0.714-4.121,2.757-4.121h3.283V12.46 c-0.577-0.078-1.797-0.248-4.102-0.248c-4.814,0-7.636,2.542-7.636,8.334v3.498H16.06v5.258h4.948v14.452 C21.988,43.9,22.981,44,24,44c0.921,0,1.82-0.084,2.707-0.204V29.301z"
                                                ></path>
                                            </svg>
                                        </a>
                                        <a
                                            href="https://twitter.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                x="0px"
                                                y="0px"
                                                width="36"
                                                height="36"
                                                viewBox="0 0 50 50"
                                            >
                                                <path d="M 11 4 C 7.134 4 4 7.134 4 11 L 4 39 C 4 42.866 7.134 46 11 46 L 39 46 C 42.866 46 46 42.866 46 39 L 46 11 C 46 7.134 42.866 4 39 4 L 11 4 z M 13.085938 13 L 21.023438 13 L 26.660156 21.009766 L 33.5 13 L 36 13 L 27.789062 22.613281 L 37.914062 37 L 29.978516 37 L 23.4375 27.707031 L 15.5 37 L 13 37 L 22.308594 26.103516 L 13.085938 13 z M 16.914062 15 L 31.021484 35 L 34.085938 35 L 19.978516 15 L 16.914062 15 z"></path>
                                            </svg>
                                        </a>
                                        <a
                                            href="https://instagram.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                x="0px"
                                                y="0px"
                                                width="36"
                                                height="36"
                                                viewBox="0 0 48 48"
                                            >
                                                <radialGradient
                                                    id="yOrnnhliCrdS2gy~4tD8ma_Xy10Jcu1L2Su_gr1"
                                                    cx="19.38"
                                                    cy="42.035"
                                                    r="44.899"
                                                    gradientUnits="userSpaceOnUse"
                                                >
                                                    <stop
                                                        offset="0"
                                                        stop-color="#fd5"
                                                    ></stop>
                                                    <stop
                                                        offset=".328"
                                                        stop-color="#ff543f"
                                                    ></stop>
                                                    <stop
                                                        offset=".348"
                                                        stop-color="#fc5245"
                                                    ></stop>
                                                    <stop
                                                        offset=".504"
                                                        stop-color="#e64771"
                                                    ></stop>
                                                    <stop
                                                        offset=".643"
                                                        stop-color="#d53e91"
                                                    ></stop>
                                                    <stop
                                                        offset=".761"
                                                        stop-color="#cc39a4"
                                                    ></stop>
                                                    <stop
                                                        offset=".841"
                                                        stop-color="#c837ab"
                                                    ></stop>
                                                </radialGradient>
                                                <path
                                                    fill="url(#yOrnnhliCrdS2gy~4tD8ma_Xy10Jcu1L2Su_gr1)"
                                                    d="M34.017,41.99l-20,0.019c-4.4,0.004-8.003-3.592-8.008-7.992l-0.019-20	c-0.004-4.4,3.592-8.003,7.992-8.008l20-0.019c4.4-0.004,8.003,3.592,8.008,7.992l0.019,20	C42.014,38.383,38.417,41.986,34.017,41.99z"
                                                ></path>
                                                <radialGradient
                                                    id="yOrnnhliCrdS2gy~4tD8mb_Xy10Jcu1L2Su_gr2"
                                                    cx="11.786"
                                                    cy="5.54"
                                                    r="29.813"
                                                    gradientTransform="matrix(1 0 0 .6663 0 1.849)"
                                                    gradientUnits="userSpaceOnUse"
                                                >
                                                    <stop
                                                        offset="0"
                                                        stop-color="#4168c9"
                                                    ></stop>
                                                    <stop
                                                        offset=".999"
                                                        stop-color="#4168c9"
                                                        stop-opacity="0"
                                                    ></stop>
                                                </radialGradient>
                                                <path
                                                    fill="url(#yOrnnhliCrdS2gy~4tD8mb_Xy10Jcu1L2Su_gr2)"
                                                    d="M34.017,41.99l-20,0.019c-4.4,0.004-8.003-3.592-8.008-7.992l-0.019-20	c-0.004-4.4,3.592-8.003,7.992-8.008l20-0.019c4.4-0.004,8.003,3.592,8.008,7.992l0.019,20	C42.014,38.383,38.417,41.986,34.017,41.99z"
                                                ></path>
                                                <path
                                                    fill="#fff"
                                                    d="M24,31c-3.859,0-7-3.14-7-7s3.141-7,7-7s7,3.14,7,7S27.859,31,24,31z M24,19c-2.757,0-5,2.243-5,5	s2.243,5,5,5s5-2.243,5-5S26.757,19,24,19z"
                                                ></path>
                                                <circle
                                                    cx="31.5"
                                                    cy="16.5"
                                                    r="1.5"
                                                    fill="#fff"
                                                ></circle>
                                                <path
                                                    fill="#fff"
                                                    d="M30,37H18c-3.859,0-7-3.14-7-7V18c0-3.86,3.141-7,7-7h12c3.859,0,7,3.14,7,7v12	C37,33.86,33.859,37,30,37z M18,13c-2.757,0-5,2.243-5,5v12c0,2.757,2.243,5,5,5h12c2.757,0,5-2.243,5-5V18c0-2.757-2.243-5-5-5H18z"
                                                ></path>
                                            </svg>
                                        </a>
                                        <a
                                            href="https://telegram.org"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                x="0px"
                                                y="0px"
                                                width="36"
                                                height="36"
                                                viewBox="0 0 48 48"
                                            >
                                                <path
                                                    fill="#29b6f6"
                                                    d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"
                                                ></path>
                                                <path
                                                    fill="#fff"
                                                    d="M33.95,15l-3.746,19.126c0,0-0.161,0.874-1.245,0.874c-0.576,0-0.873-0.274-0.873-0.274l-8.114-6.733 l-3.97-2.001l-5.095-1.355c0,0-0.907-0.262-0.907-1.012c0-0.625,0.933-0.923,0.933-0.923l21.316-8.468 c-0.001-0.001,0.651-0.235,1.126-0.234C33.667,14,34,14.125,34,14.5C34,14.75,33.95,15,33.95,15z"
                                                ></path>
                                                <path
                                                    fill="#b0bec5"
                                                    d="M23,30.505l-3.426,3.374c0,0-0.149,0.115-0.348,0.12c-0.069,0.002-0.143-0.009-0.219-0.043 l0.964-5.965L23,30.505z"
                                                ></path>
                                                <path
                                                    fill="#cfd8dc"
                                                    d="M29.897,18.196c-0.169-0.22-0.481-0.26-0.701-0.093L16,26c0,0,2.106,5.892,2.427,6.912 c0.322,1.021,0.58,1.045,0.58,1.045l0.964-5.965l9.832-9.096C30.023,18.729,30.064,18.416,29.897,18.196z"
                                                ></path>
                                            </svg>
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Categories, Brands, and Contact Info - Right Side */}
                            <div className="lg:col-span-1">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Categories - Start */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">
                                            Categories
                                        </h3>
                                        <div className="grid grid-cols-1 gap-y-2">
                                            <Link
                                                href="/shop?category=1"
                                                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                                            >
                                                Smartphones
                                            </Link>
                                            <Link
                                                href="/shop?category=2"
                                                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                                            >
                                                HeadPhones
                                            </Link>
                                            <Link
                                                href="/shop?category=3"
                                                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                                            >
                                                Speakers
                                            </Link>
                                            <Link
                                                href="/shop?category=4"
                                                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                                            >
                                                Accessories
                                            </Link>
                                            <Link
                                                href="/shop?category=5"
                                                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                                            >
                                                Earphones
                                            </Link>
                                            <Link
                                                href="/shop?category=6"
                                                className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                                            >
                                                SmartWatch
                                            </Link>
                                        </div>
                                    </div>{" "}
                                    {/* Brands - Middle */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">
                                            Brands
                                        </h3>
                                        <div className="grid grid-cols-1 gap-y-2">
                                            {FEATURED_BRANDS.map((brand) => (
                                                <Link
                                                    key={brand.brand_id}
                                                    href={`/shop?brand=${brand.brand_id}`}
                                                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm"
                                                >
                                                    {brand.brand_title}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Contact Info - End */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">
                                            Contact Info
                                        </h3>
                                        <div className="space-y-2 text-gray-600">
                                            <p className="text-sm">
                                                📞 +855 123-4567
                                            </p>
                                            <p className="text-sm">
                                                📧 info@JBshop.com
                                            </p>
                                            <p className="text-sm">
                                                📍 123 Main Street, Phnom Penh
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 w-full pt-4">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm space-y-2 md:space-y-0">
                                <p className="text-center md:text-left">
                                    &copy; 2025 Phone Shop. All rights reserved.
                                </p>
                                <div className="flex space-x-4 pb-4">
                                    <a
                                        href="/privacy"
                                        className="hover:underline text-gray-600"
                                    >
                                        Privacy Policy
                                    </a>
                                    <a
                                        href="/terms"
                                        className="hover:underline text-gray-600"
                                    >
                                        Terms of Use
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* Chat Support */}
                <div className="fixed bottom-6 right-6 z-40">
                    <ChatSupport auth={auth} />
                </div>
            </div>
        </>
    );
}
