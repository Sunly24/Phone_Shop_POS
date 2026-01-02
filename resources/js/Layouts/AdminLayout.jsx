import React, { useEffect, useRef } from "react";
import "admin-lte/dist/js/adminlte.min.js";
import MenuSideBar from "./MenuSideBar";
import Notification from "@/Components/Notification";
import $ from "jquery";
import { Link, usePage } from "@inertiajs/react";
import Switcher from "@/Components/Switcher";
import { MdHistory } from "react-icons/md";
import { useTranslation } from "react-i18next";

// Custom styles for staff layout (no sidebar)
const staffLayoutStyles = {
    contentWrapper: {
        marginLeft: 0,
        transition: "margin-left 0.3s",
    },
    navbar: {
        marginLeft: 0,
        transition: "margin-left 0.3s",
    },
    footer: {
        marginLeft: 0,
        transition: "margin-left 0.3s",
    },
};

const AdminLayout = ({ breadcrumb, children, hideFooter = false }) => {
    const { t, i18n } = useTranslation();
    const user = usePage().props.auth.user;

    useEffect(() => {
        // Set language attribute on the root element when the language changes
        document.documentElement.setAttribute("data-lang", i18n.language);
    }, [i18n.language]);
    const hamburgerRef = useRef(null);

    const isStaff = user?.roles?.some((role) => role.name === "Staff");

    useEffect(() => {
        // Add AdminLTE classes for proper mini sidebar functionality
        document.body.classList.add(
            "hold-transition",
            "sidebar-mini",
            "layout-fixed",
            "layout-navbar-fixed"
        );

        // Force hide sidebar for staff users
        if (isStaff) {
            document.body.classList.add("sidebar-collapse");
            document.body.style.setProperty("--sidebar-width", "0px");

            // Force remove any sidebar elements with JavaScript - but be more targeted
            const removeSidebarElements = () => {
                // Hide sidebar elements
                const sidebarElements = document.querySelectorAll(
                    "aside.main-sidebar, .main-sidebar:not(.main-header):not(.main-footer):not(.content-wrapper)"
                );
                sidebarElements.forEach((element) => {
                    if (
                        element &&
                        element.tagName !== "NAV" &&
                        !element.closest(".main-header")
                    ) {
                        element.style.display = "none";
                        element.style.visibility = "hidden";
                        element.style.width = "0px";
                        element.style.marginLeft = "0px";
                    }
                });

                // Force full width for content elements
                const contentElements = document.querySelectorAll(
                    ".content-wrapper, .main-footer, .main-header, .wrapper, .content, .container-fluid"
                );
                contentElements.forEach((element) => {
                    if (element) {
                        element.style.marginLeft = "0px";
                        element.style.paddingLeft =
                            element.classList.contains("content") ||
                            element.classList.contains("container-fluid")
                                ? "15px"
                                : "0px";
                        element.style.width = "100%";
                        element.style.maxWidth = "100%";
                    }
                });

                // Also ensure body classes don't interfere
                document.body.classList.remove("sidebar-open");
                document.body.classList.add("sidebar-collapse");
            };

            // Apply immediately and set up a few retries
            removeSidebarElements();
            setTimeout(removeSidebarElements, 100);
            setTimeout(removeSidebarElements, 500);
            setTimeout(removeSidebarElements, 1000);
        }

        // Initialize AdminLTE components
        $('[data-toggle="dropdown"]').dropdown();

        // Initialize AdminLTE Layout and PushMenu
        if (window.AdminLTE) {
            if (window.AdminLTE.Layout) {
                window.AdminLTE.Layout.fixSidebar();
            }
            if (window.AdminLTE.PushMenu) {
                window.AdminLTE.PushMenu.init();
            }
        }

        // Ensure sidebar starts in proper state
        document.body.classList.remove("sidebar-collapse", "sidebar-open");

        return () => {
            // Cleanup classes when component unmounts
            document.body.classList.remove(
                "hold-transition",
                "sidebar-mini",
                "layout-fixed",
                "layout-navbar-fixed",
                "sidebar-collapse",
                "sidebar-open"
            );
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
                
                /* Force hide sidebar for staff users - targeted approach */
                ${
                    isStaff
                        ? `
                /* Hide sidebar completely */
                aside.main-sidebar,
                .main-sidebar,
                .main-sidebar.main-sidebar {
                    display: none !important;
                    visibility: hidden !important;
                    width: 0 !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    position: absolute !important;
                    left: -9999px !important;
                }
                
                /* Force full width layout for all main elements */
                .wrapper,
                .wrapper.wrapper {
                    margin-left: 0 !important;
                    padding-left: 0 !important;
                    width: 100% !important;
                }
                
                .content-wrapper,
                .content-wrapper.content-wrapper {
                    margin-left: 0 !important;
                    padding-left: 0 !important;
                    margin-right: 0 !important;
                    padding-right: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                }
                
                .main-footer,
                .main-footer.main-footer {
                    margin-left: 0 !important;
                    padding-left: 0 !important;
                    width: 100% !important;
                }
                
                .main-header.navbar,
                .navbar.main-header {
                    margin-left: 0 !important;
                    padding-left: 0 !important;
                    width: 100% !important;
                    left: 0 !important;
                }
                
                /* Ensure sidebar states don't interfere */
                body.sidebar-mini .main-sidebar,
                body.sidebar-collapse .main-sidebar,
                body.sidebar-mini.sidebar-collapse .main-sidebar {
                    display: none !important;
                    margin-left: 0 !important;
                    width: 0 !important;
                }
                
                /* Force content areas to full width */
                .content,
                .content.content,
                .container-fluid,
                .container-fluid.container-fluid {
                    margin-left: 0 !important;
                    padding-left: 15px !important;
                    padding-right: 15px !important;
                    max-width: 100% !important;
                    width: 100% !important;
                    box-sizing: border-box !important;
                }
                
                /* Override AdminLTE sidebar calculations */
                @media (min-width: 992px) {
                    body.sidebar-mini.sidebar-collapse .content-wrapper,
                    body.sidebar-mini.sidebar-collapse .main-footer,
                    body.sidebar-mini.sidebar-collapse .main-header {
                        margin-left: 0 !important;
                        width: 100% !important;
                    }
                }
                
                /* Ensure no hidden margins or spacing */
                * {
                    --sidebar-width: 0px !important;
                }
                
                body[class*="sidebar"] .content-wrapper {
                    margin-left: 0 !important;
                    width: 100% !important;
                }
                
                body[class*="sidebar"] .main-footer {
                    margin-left: 0 !important;
                    width: 100% !important;
                }
                
                body[class*="sidebar"] .main-header {
                    margin-left: 0 !important;
                    width: 100% !important;
                }
                `
                        : ""
                }
                `,
                }}
            />
            <div className="wrapper">
                {/* Navbar */}
                <nav
                    className="main-header navbar navbar-expand navbar-white navbar-light fixed-top"
                    style={isStaff ? staffLayoutStyles.navbar : {}}
                >
                    {/* Only show sidebar toggle for admin users */}
                    <ul className="navbar-nav">
                        {/* Only show hamburger for admin users, not staff */}
                        {!isStaff && (
                            <li className="nav-item">
                                <button
                                    ref={hamburgerRef}
                                    className="nav-link btn btn-link"
                                    data-widget="pushmenu"
                                    type="button"
                                    aria-label="Toggle navigation"
                                    style={{
                                        cursor: "pointer",
                                        border: "none",
                                        background: "none",
                                        color: "inherit",
                                        padding: "0.375rem 0.75rem",
                                    }}
                                >
                                    <i className="fas fa-bars"></i>
                                </button>
                            </li>
                        )}
                    </ul>
                    {/* <!-- Right navbar links --> */}
                    <ul className="navbar-nav ml-auto align-items-center">
                        {/* Unified Notification */}
                        <li className="nav-item">
                            <div className="nav-link p-2">
                                <Notification />
                            </div>
                        </li>

                        <li className="nav-item">
                            <div className="nav-link p-2">
                                <Switcher />
                            </div>
                        </li>

                        {/* User Dropdown */}
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link d-flex align-items-center"
                                data-toggle="dropdown"
                                href="#"
                                style={{ padding: "0.5rem" }}
                            >
                                <div className="w-8 h-8 rounded-full bg-white p-0.5 mr-2">
                                    <img
                                        src={user.profile_photo_url}
                                        className="w-full h-full rounded-full object-cover"
                                        alt={user.name}
                                    />
                                </div>
                                <span className="d-none d-md-inline font-weight-medium text-dark">
                                    {user.name}
                                </span>
                                <i
                                    className="fas fa-chevron-down ml-2 text-muted"
                                    style={{ fontSize: "0.75rem" }}
                                ></i>
                            </a>
                            <div
                                className="dropdown-menu dropdown-menu-right border-0"
                                style={{
                                    minWidth: "280px",
                                    borderRadius: "12px",
                                }}
                            >
                                {/* User Info Header */}
                                <div className="px-4 py-3 border-bottom">
                                    <h6 className="mb-1 font-weight-bold text-dark">
                                        {user.name}
                                    </h6>
                                    <p className="mb-0 text-muted small">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <Link
                                        href={
                                            route().has("profile.edit")
                                                ? route("profile.edit")
                                                : "#"
                                        }
                                        className="dropdown-item d-flex align-items-center py-2 px-4"
                                        style={{
                                            transition:
                                                "background-color 0.15s ease",
                                        }}
                                    >
                                        <div
                                            className="rounded-circle bg-light p-2 mr-3"
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <i
                                                className="fas fa-user text-primary"
                                                style={{ fontSize: "0.875rem" }}
                                            ></i>
                                        </div>
                                        <span className="text-dark">
                                            Edit profile
                                        </span>
                                    </Link>

                                    {isStaff && (
                                        <Link
                                            href={route("orders.index")}
                                            className="dropdown-item d-flex align-items-center py-2 px-4"
                                            style={{
                                                transition:
                                                    "background-color 0.15s ease",
                                            }}
                                        >
                                            <div
                                                className="rounded-circle bg-light p-2 mr-3"
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <MdHistory className="w-6 h-6 text-primary" />
                                            </div>
                                            <span className="text-dark">
                                                Order History
                                            </span>
                                        </Link>
                                    )}

                                    {/* Only show chat link if route exists */}
                                    {route().has("chat.index") && (
                                        <Link
                                            href={route("chat.index")}
                                            className="dropdown-item d-flex align-items-center py-2 px-4"
                                            style={{
                                                transition:
                                                    "background-color 0.15s ease",
                                            }}
                                        >
                                            <div
                                                className="rounded-circle bg-light p-2 mr-3"
                                                style={{
                                                    width: "32px",
                                                    height: "32px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <i
                                                    className="fas fa-question-circle text-info"
                                                    style={{
                                                        fontSize: "0.875rem",
                                                    }}
                                                ></i>
                                            </div>
                                            <span className="text-dark">
                                                Support
                                            </span>
                                        </Link>
                                    )}
                                </div>

                                <div className="dropdown-divider mx-3"></div>

                                {/* Logout */}
                                <div className="py-2">
                                    <Link
                                        className="dropdown-item d-flex align-items-center py-2 px-4"
                                        method="post"
                                        href={
                                            route().has("logout")
                                                ? route("logout")
                                                : "#"
                                        }
                                        as="button"
                                        style={{
                                            transition:
                                                "background-color 0.15s ease",
                                        }}
                                    >
                                        <div
                                            className="rounded-circle bg-light p-2 mr-3"
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <i
                                                className="fas fa-sign-out-alt text-danger"
                                                style={{ fontSize: "0.875rem" }}
                                            ></i>
                                        </div>
                                        <span className="text-dark">
                                            Sign out
                                        </span>
                                    </Link>
                                </div>
                            </div>
                        </li>
                    </ul>
                </nav>

                {/* Sidebar section - completely conditional */}
                {!isStaff ? (
                    <MenuSideBar />
                ) : (
                    <div style={{ display: "none" }} id="staff-no-sidebar">
                        {/* No sidebar for staff users */}
                    </div>
                )}

                {/* Content Wrapper - Let AdminLTE handle the margin adjustments - full width for staff, normal for admin */}
                <div
                    className="content-wrapper"
                    style={isStaff ? staffLayoutStyles.contentWrapper : {}}
                >
                    <div className="content-header">
                        {breadcrumb && breadcrumb}
                    </div>
                    <section className="content">
                        <div className="container-fluid">{children}</div>
                    </section>
                </div>
                {!hideFooter && (
                    <footer
                        className={`main-footer ${
                            isStaff ? "ml-0" : "ml-0 md:ml-64"
                        } bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 border-t border-gray-200 dark:border-gray-700 transition-all duration-300`}
                    >
                        <div className="container mx-auto px-6">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="text-center md:text-left">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-200 tracking-tight">
                                        © {new Date().getFullYear()}{" "}
                                        {t("footer.copyright")}.{" "}
                                        {t("footer.allRightsReserved")}
                                    </span>
                                </div>
                                <div className="flex space-x-6">
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 ease-in-out relative group"
                                    >
                                        <span className="sr-only">
                                            Privacy Policy
                                        </span>
                                        <span>{t("footer.privacy")}</span>
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
                                    </a>
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 ease-in-out relative group"
                                    >
                                        <span className="sr-only">Terms</span>
                                        <span>{t("footer.terms")}</span>
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
                                    </a>
                                    <a
                                        href="#"
                                        className="text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 ease-in-out relative group"
                                    >
                                        <span className="sr-only">Contact</span>
                                        <span>{t("footer.contact")}</span>
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 dark:bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </footer>
                )}
            </div>
        </>
    );
};

export default AdminLayout;
