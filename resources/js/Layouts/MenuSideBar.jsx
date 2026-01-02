import { Link, usePage } from "@inertiajs/react";
import $ from "jquery";
import "admin-lte/dist/css/adminlte.min.css";
import "admin-lte/dist/js/adminlte.min.js";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function MenuSideBar() {
    const { url, auth } = usePage().props;
    const can = auth?.can ?? {};
    const isStaff = auth?.user?.roles?.some((role) => role.name === "Staff");
    const { t } = useTranslation();

    if (isStaff) {
        return null;
    }

    useEffect(() => {
        // Initialize AdminLTE functionality after each navigation
        const initializeAdminLTE = () => {
            // Remove existing event bindings to prevent duplicates
            $('.nav-sidebar [data-widget="treeview"]').off();
            $('[data-widget="pushmenu"]').off();

            // Initialize AdminLTE Layout
            if (window.AdminLTE && window.AdminLTE.Layout) {
                window.AdminLTE.Layout.fixSidebar();
            }

            // Initialize PushMenu (sidebar toggle) functionality
            if ($.fn.PushMenu) {
                $('[data-widget="pushmenu"]').PushMenu("init");
            } else {
                // Manual initialization if PushMenu plugin isn't available
                $('[data-widget="pushmenu"]')
                    .off("click.pushmenu")
                    .on("click.pushmenu", function (e) {
                        e.preventDefault();

                        const $body = $("body");
                        const $sidebar = $(".main-sidebar");

                        if ($body.hasClass("sidebar-collapse")) {
                            $body
                                .removeClass("sidebar-collapse")
                                .addClass("sidebar-open");
                            $sidebar.trigger("expanded.lte.pushmenu");
                        } else {
                            $body
                                .removeClass("sidebar-open")
                                .addClass("sidebar-collapse");
                            $sidebar.trigger("collapsed.lte.pushmenu");
                        }
                    });
            }

            // Initialize treeview functionality
            $('.nav-sidebar [data-widget="treeview"]').each(function () {
                const $this = $(this);
                if ($.fn.Treeview) {
                    $this.Treeview({
                        accordion: false,
                        animationSpeed: 300,
                        expandSidebar: false,
                        sidebarButtonSelector: '[data-widget="pushmenu"]',
                    });
                }
            });
        };

        // Handle menu item clicks for treeview
        const handleMenuClicks = () => {
            $(".nav-sidebar .nav-link")
                .off("click.treeview")
                .on("click.treeview", function (e) {
                    const $this = $(this);
                    const $parent = $this.parent(".nav-item");

                    // Only handle treeview items (those with sub-menus)
                    if (
                        $parent.find(".nav-treeview").length > 0 &&
                        $this.attr("href") === "#"
                    ) {
                        e.preventDefault();
                        e.stopPropagation();

                        // Toggle the menu
                        if ($parent.hasClass("menu-open")) {
                            $parent.removeClass("menu-open menu-is-opening");
                            $parent.find(".nav-treeview").slideUp(300);
                        } else {
                            // Close other open menus (accordion effect)
                            $(".nav-sidebar .nav-item.menu-open")
                                .not($parent)
                                .each(function () {
                                    $(this).removeClass(
                                        "menu-open menu-is-opening"
                                    );
                                    $(this).find(".nav-treeview").slideUp(300);
                                });

                            // Open this menu
                            $parent.addClass("menu-is-opening");
                            $parent
                                .find(".nav-treeview")
                                .slideDown(300, function () {
                                    $parent
                                        .addClass("menu-open")
                                        .removeClass("menu-is-opening");
                                });
                        }
                    }
                });
        };

        // Initialize everything with a slight delay to ensure DOM is ready
        const initTimeout = setTimeout(() => {
            initializeAdminLTE();
            handleMenuClicks();

            // Trigger layout fix after initialization
            if (window.AdminLTE && window.AdminLTE.Layout) {
                window.AdminLTE.Layout.fixSidebar();
            }
        }, 100);

        // Cleanup function
        return () => {
            clearTimeout(initTimeout);
            $(".nav-sidebar .nav-link").off("click.treeview");
            $('.nav-sidebar [data-widget="treeview"]').off();
            $('[data-widget="pushmenu"]').off("click.pushmenu");
        };
    }, [url]); // Re-run when URL changes (navigation occurs)

    return (
        <>
            {/* Force profile photo to maintain consistent size with high specificity */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    /* Very specific selectors to override AdminLTE styles */
                    .main-sidebar .user-panel img,
                    .sidebar .user-panel img,
                    .main-sidebar .sidebar .user-panel img {
                        width: 2.1rem !important;
                        height: 2.1rem !important;
                        min-width: 2.1rem !important;
                        min-height: 2.1rem !important;
                        max-width: 2.1rem !important;
                        max-height: 2.1rem !important;
                        object-fit: cover !important;
                        border-radius: 50% !important;
                    }

                    /* When sidebar is collapsed, center the photo and remove spacing */
                    .sidebar-mini.sidebar-collapse .main-sidebar .user-panel {
                        text-align: center !important;
                        display: block !important;
                        padding-bottom: 0.5rem !important;
                        margin-bottom: 0.5rem !important;
                        border-bottom: 1px solid #dee2e6 !important;
                    }

                    .sidebar-mini.sidebar-collapse .main-sidebar .user-panel .image {
                        display: block !important;
                        float: none !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        padding-bottom: 0 !important;
                        margin-bottom: 0 !important;
                        width: 100% !important;
                        text-align: center !important;
                        margin: 0 auto !important;
                    }

                    /* Hide the user info completely when collapsed to remove spacing */
                    .sidebar-mini.sidebar-collapse .main-sidebar .user-panel .info {
                        display: none !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: hidden !important;
                    }

                    /* Force photo size even when collapsed - MAXIMUM SPECIFICITY */
                    body.sidebar-mini.sidebar-collapse .main-sidebar .user-panel img,
                    body.sidebar-mini.sidebar-collapse .main-sidebar .sidebar .user-panel img,
                    .wrapper .sidebar-mini.sidebar-collapse .main-sidebar .user-panel img,
                    .sidebar-mini.sidebar-collapse .main-sidebar .user-panel img,
                    .sidebar-mini.sidebar-collapse .main-sidebar .sidebar .user-panel img {
                        width: 2.1rem !important;
                        height: 2.1rem !important;
                        min-width: 2.1rem !important;
                        min-height: 2.1rem !important;
                        max-width: 2.1rem !important;
                        max-height: 2.1rem !important;
                        margin: 0 auto !important;
                        display: block !important;
                        object-fit: cover !important;
                        border-radius: 50% !important;
                        box-sizing: border-box !important;
                    }

                    /* Remove any bottom spacing from user panel when collapsed */
                    .sidebar-mini.sidebar-collapse .main-sidebar .user-panel,
                    .sidebar-mini.sidebar-collapse .main-sidebar .sidebar .user-panel {
                        padding-bottom: 0.5rem !important;
                        margin-bottom: 0.5rem !important;
                        min-height: auto !important;
                        height: auto !important;
                    }

                    /* Section separators when sidebar is collapsed */
                    .sidebar-mini.sidebar-collapse .main-sidebar .nav-header {
                        display: none !important;
                    }

                    /* Use specific classes instead of nth-child for reliable separators */
                    
                    /* Separator after Dashboard link */
                    .sidebar-mini.sidebar-collapse .main-sidebar .separator-after-dashboard {
                        border-bottom: 1px solid #dee2e6 !important;
                        margin-bottom: 0.5rem !important;
                        padding-bottom: 0.5rem !important;
                    }

                    /* Separator after system settings */
                    .sidebar-mini.sidebar-collapse .main-sidebar .separator-after-system {
                        border-bottom: 1px solid #dee2e6 !important;
                        margin-bottom: 0.5rem !important;
                        padding-bottom: 0.5rem !important;
                    }

                    /* Navigation icon sizes for comparison - ensure they match */
                    .nav-sidebar > .nav-item .nav-icon {
                        width: 1.6rem !important;
                        height: auto !important;
                        font-size: 1.2rem !important;
                    }

                    /* Add spacing between avatar and name in user panel */
                    .main-sidebar .user-panel .image {
                        margin-right: 12px !important;
                    }

                    /* When sidebar expands on hover, restore normal layout */
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand):hover .user-panel,
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand).sidebar-focused .user-panel {
                        text-align: left !important;
                        padding-bottom: 1rem !important;
                        margin-bottom: 1rem !important;
                        border-bottom: 1px solid #dee2e6 !important;
                    }

                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand):hover .user-panel .image,
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand).sidebar-focused .user-panel .image {
                        display: inline-block !important;
                        padding-left: 0.8rem !important;
                        padding-bottom: 0 !important;
                        margin-bottom: 0 !important;
                        width: auto !important;
                        text-align: left !important;
                        float: left !important;
                        margin-right: 12px !important;
                    }

                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand):hover .user-panel img,
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand).sidebar-focused .user-panel img {
                        margin: 0 !important;
                        display: inline-block !important;
                    }

                    /* Show user info when sidebar expands */
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand):hover .user-panel .info,
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand).sidebar-focused .user-panel .info {
                        display: inline-block !important;
                        visibility: visible !important;
                        height: auto !important;
                        padding: 5px 5px 5px 10px !important;
                        margin: 0 !important;
                        overflow: visible !important;
                    }

                    /* Remove section separators when sidebar expands */
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand):hover .nav-sidebar .nav-item,
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand).sidebar-focused .nav-sidebar .nav-item {
                        border-bottom: none !important;
                        margin-bottom: 0 !important;
                        padding-bottom: 0 !important;
                    }

                    /* Show section headers when sidebar expands */
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand):hover .nav-header,
                    .sidebar-mini.sidebar-collapse .main-sidebar:not(.sidebar-no-expand).sidebar-focused .nav-header {
                        display: block !important;
                        border-bottom: 1px solid #e5e7eb !important;
                        padding-bottom: 0.5rem !important;
                        margin-bottom: 0.75rem !important;
                    }
                    .main-sidebar .nav-header {
                        font-size: 16px !important;
                        border-top: 1px solid #e5e7eb;
                        padding-bottom: 0.5rem;
                        margin-top: 0.75rem;
                    }
                    .main-sidebar .nav-header:last-of-type {
                        border-top: none !important;
                        margin-top: 0;
                    }
                `,
                }}
            />

            {/* Sidebar - Use AdminLTE classes for light sidebar theme */}
            <aside className="main-sidebar sidebar-light-primary elevation-4">
                <Link href="/dashboard" className="brand-link">
                    <img
                        src="/images/brand-logo/blue-logo.png"
                        alt="JB PHONE SHOP Logo"
                        className="h-8 w-auto object-contain items-center mx-auto"
                    />
                </Link>

                <div className="sidebar">
                    <div className="user-panel mt-3 pb-3 mb-3 d-flex">
                        <div className="image">
                            <img
                                src={auth?.user?.profile_photo_url}
                                className="img-circle elevation-2"
                                alt={auth?.user?.name}
                            />
                        </div>
                        <div className="info">
                            <Link
                                href={route("profile.show")}
                                className="d-block"
                            >
                                {auth?.user?.name}
                            </Link>
                        </div>
                    </div>

                    <div className="form-inline">
                        <div
                            className="input-group"
                            data-widget="sidebar-search"
                        >
                            <input
                                className="form-control form-control-sidebar"
                                type="search"
                                placeholder={t("common.search")}
                                aria-label="Search"
                            />
                            <div className="input-group-append">
                                <button className="btn btn-sidebar">
                                    <i className="fas fa-search fa-fw"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <nav className="mt-2">
                        <ul
                            className="nav nav-pills nav-sidebar flex-column"
                            data-widget="treeview"
                            role="menu"
                            data-accordion="false"
                        >
                            {/* DASHBOARD ANALYTICS */}
                            <li className="nav-item separator-after-dashboard">
                                <Link
                                    href={route("dashboard")}
                                    className={`nav-link ${
                                        route().current("dashboard") && "active"
                                    }`}
                                >
                                    <i className="nav-icon fa-solid fa-qrcode"></i>
                                    <p>{t("menu.dashboard")}</p>
                                </Link>
                            </li>

                            {/* PRODUCT MANAGEMENT */}
                            {(can["product-list"] ||
                                can["category-list"] ||
                                can["brand-list"] ||
                                can["maker-list"] ||
                                can["size-list"] ||
                                can["color-list"]) && (
                                <>
                                    <li className="nav-header">
                                        Product Management
                                    </li>

                                    {/* PRODUCT */}
                                    {can["product-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "products.index"
                                                ) ||
                                                    route().current(
                                                        "products.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "products.index"
                                                    ) ||
                                                        route().current(
                                                            "products.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="nav-icon fa-solid fa-box-archive"></i>
                                                <p>
                                                    {t("menu.product")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "products.index"
                                                        ) ||
                                                        route().current(
                                                            "products.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "products.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "products.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "products.create"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "products.create"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-plus nav-icon"></i>
                                                        <p>
                                                            {t("menu.create")}
                                                        </p>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </li>
                                    )}

                                    {/* CATEGORY */}
                                    {can["category-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "categories.index"
                                                ) ||
                                                    route().current(
                                                        "categories.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "categories.index"
                                                    ) ||
                                                        route().current(
                                                            "categories.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="nav-icon fa-solid fa-table-list"></i>
                                                <p>
                                                    {t("menu.category")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "categories.index"
                                                        ) ||
                                                        route().current(
                                                            "categories.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "categories.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "categories.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                                {can["category-create"] && (
                                                    <li className="nav-item">
                                                        <Link
                                                            href={route(
                                                                "categories.create"
                                                            )}
                                                            className={`nav-link ${
                                                                route().current(
                                                                    "categories.create"
                                                                ) && "active"
                                                            }`}
                                                        >
                                                            <i className="fa-solid fa-plus nav-icon"></i>
                                                            <p>
                                                                {t(
                                                                    "menu.create"
                                                                )}
                                                            </p>
                                                        </Link>
                                                    </li>
                                                )}
                                            </ul>
                                        </li>
                                    )}

                                    {/* BRAND */}
                                    {can["brand-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "brands.index"
                                                ) ||
                                                    route().current(
                                                        "brands.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "brands.index"
                                                    ) ||
                                                        route().current(
                                                            "brands.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="nav-icon fas fa-industry"></i>
                                                <p>
                                                    {t("menu.brand")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "brands.index"
                                                        ) ||
                                                        route().current(
                                                            "brands.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "brands.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "brands.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                                {can["brand-create"] && (
                                                    <li className="nav-item">
                                                        <Link
                                                            href={route(
                                                                "brands.create"
                                                            )}
                                                            className={`nav-link ${
                                                                route().current(
                                                                    "brands.create"
                                                                ) && "active"
                                                            }`}
                                                        >
                                                            <i className="fa-solid fa-plus nav-icon"></i>
                                                            <p>
                                                                {t(
                                                                    "menu.create"
                                                                )}
                                                            </p>
                                                        </Link>
                                                    </li>
                                                )}
                                            </ul>
                                        </li>
                                    )}

                                    {/* COLOR */}
                                    {can["color-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "colors.index"
                                                ) ||
                                                    route().current(
                                                        "colors.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "colors.index"
                                                    ) ||
                                                        route().current(
                                                            "colors.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="nav-icon fas fa-palette"></i>
                                                <p>
                                                    {t("menu.color")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "colors.index"
                                                        ) ||
                                                        route().current(
                                                            "colors.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "colors.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "colors.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                                {can["color-create"] && (
                                                    <li className="nav-item">
                                                        <Link
                                                            href={route(
                                                                "colors.create"
                                                            )}
                                                            className={`nav-link ${
                                                                route().current(
                                                                    "colors.create"
                                                                ) && "active"
                                                            }`}
                                                        >
                                                            <i className="fa-solid fa-plus nav-icon"></i>
                                                            <p>
                                                                {t(
                                                                    "menu.create"
                                                                )}
                                                            </p>
                                                        </Link>
                                                    </li>
                                                )}
                                            </ul>
                                        </li>
                                    )}

                                    {/* SIZE */}
                                    {can["size-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "sizes.index"
                                                ) ||
                                                    route().current(
                                                        "sizes.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "sizes.index"
                                                    ) ||
                                                        route().current(
                                                            "sizes.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="fa-solid fa-up-right-and-down-left-from-center nav-icon"></i>
                                                <p>
                                                    {t("menu.size")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "sizes.index"
                                                        ) ||
                                                        route().current(
                                                            "sizes.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "sizes.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "sizes.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                                {can["size-create"] && (
                                                    <li className="nav-item">
                                                        <Link
                                                            href={route(
                                                                "sizes.create"
                                                            )}
                                                            className={`nav-link ${
                                                                route().current(
                                                                    "sizes.create"
                                                                ) && "active"
                                                            }`}
                                                        >
                                                            <i className="fa-solid fa-plus nav-icon"></i>
                                                            <p>
                                                                {t(
                                                                    "menu.create"
                                                                )}
                                                            </p>
                                                        </Link>
                                                    </li>
                                                )}
                                            </ul>
                                        </li>
                                    )}

                                    {/* MAKER */}
                                    {can["maker-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "makers.index"
                                                ) ||
                                                    route().current(
                                                        "makers.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "makers.index"
                                                    ) ||
                                                        route().current(
                                                            "makers.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="nav-icon fas fa-barcode"></i>
                                                <p>
                                                    {t("menu.maker")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "makers.index"
                                                        ) ||
                                                        route().current(
                                                            "makers.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "makers.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "makers.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                                {can["maker-create"] && (
                                                    <li className="nav-item">
                                                        <Link
                                                            href={route(
                                                                "makers.create"
                                                            )}
                                                            className={`nav-link ${
                                                                route().current(
                                                                    "makers.create"
                                                                ) && "active"
                                                            }`}
                                                        >
                                                            <i className="fa-solid fa-plus nav-icon"></i>
                                                            <p>
                                                                {t(
                                                                    "menu.create"
                                                                )}
                                                            </p>
                                                        </Link>
                                                    </li>
                                                )}
                                            </ul>
                                        </li>
                                    )}
                                </>
                            )}

                            {/* ORDER MANAGEMENT */}
                            {can["order-list"] && (
                                <>
                                    <li className="nav-header">
                                        Order Management
                                    </li>

                                    {/* ORDER */}
                                    <li
                                        className={`nav-item ${
                                            (route().current("orders.index") ||
                                                route().current(
                                                    "orders.create"
                                                )) &&
                                            "menu-is-opening menu-open"
                                        }`}
                                    >
                                        <a
                                            href="#"
                                            className={`nav-link ${
                                                (route().current(
                                                    "orders.index"
                                                ) ||
                                                    route().current(
                                                        "orders.create"
                                                    )) &&
                                                "active"
                                            }`}
                                        >
                                            <i className="nav-icon fas fa-shopping-cart"></i>
                                            <p>
                                                {t("menu.order")}
                                                <i className="fas fa-angle-left right"></i>
                                            </p>
                                        </a>
                                        <ul
                                            className="nav nav-treeview"
                                            style={{
                                                display:
                                                    route().current(
                                                        "orders.index"
                                                    ) ||
                                                    route().current(
                                                        "orders.create"
                                                    )
                                                        ? "block"
                                                        : "none",
                                            }}
                                        >
                                            <li className="nav-item">
                                                <Link
                                                    href={route("orders.index")}
                                                    className={`nav-link ${
                                                        route().current(
                                                            "orders.index"
                                                        ) && "active"
                                                    }`}
                                                >
                                                    <i className="fa-solid fa-list-ul nav-icon"></i>
                                                    <p>{t("menu.list")}</p>
                                                </Link>
                                            </li>
                                        </ul>
                                    </li>
                                </>
                            )}

                            {/* INVENTORY MANAGEMENT */}
                            {(can["inventory-list"] || can["invoice-list"]) && (
                                <>
                                    <li className="nav-header">
                                        Inventory Management
                                    </li>

                                    {/* INVENTORY */}
                                    {can["inventory-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "inventory.index"
                                                ) ||
                                                    route().current(
                                                        "inventory.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "inventory.index"
                                                    ) ||
                                                        route().current(
                                                            "inventory.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="nav-icon fas fa-warehouse"></i>
                                                <p>
                                                    {t("menu.inventory")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "inventory.index"
                                                        ) ||
                                                        route().current(
                                                            "inventory.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "inventory.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "inventory.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                                {can["inventory-create"] && (
                                                    <li className="nav-item">
                                                        <Link
                                                            href={route(
                                                                "inventory.create"
                                                            )}
                                                            className={`nav-link ${
                                                                route().current(
                                                                    "inventory.create"
                                                                ) && "active"
                                                            }`}
                                                        >
                                                            <i className="fa-solid fa-plus nav-icon"></i>
                                                            <p>
                                                                {t(
                                                                    "menu.create"
                                                                )}
                                                            </p>
                                                        </Link>
                                                    </li>
                                                )}
                                            </ul>
                                        </li>
                                    )}

                                    {/* INVOICE */}
                                    {can["invoice-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "invoices.index"
                                                ) ||
                                                    route().current(
                                                        "invoices.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "invoices.index"
                                                    ) ||
                                                        route().current(
                                                            "invoices.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="nav-icon fas fa-file-invoice"></i>
                                                <p>
                                                    {t("menu.invoice")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "invoices.index"
                                                        ) ||
                                                        route().current(
                                                            "invoices.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "invoices.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "invoices.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </li>
                                    )}
                                </>
                            )}

                            {/* USER & ROLE MANAGEMENT */}
                            {(can["user-list"] || can["role-list"]) && (
                                <>
                                    <li className="nav-header">
                                        User & Role Management
                                    </li>

                                    {/* USER */}
                                    {can["user-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "users.index"
                                                ) ||
                                                    route().current(
                                                        "users.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "users.index"
                                                    ) ||
                                                        route().current(
                                                            "users.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="nav-icon fa-solid fa-user-large"></i>
                                                <p>
                                                    {t("menu.user")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "users.index"
                                                        ) ||
                                                        route().current(
                                                            "users.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "users.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "users.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                                {can["user-create"] && (
                                                    <li className="nav-item">
                                                        <Link
                                                            href={route(
                                                                "users.create"
                                                            )}
                                                            className={`nav-link ${
                                                                route().current(
                                                                    "users.create"
                                                                ) && "active"
                                                            }`}
                                                        >
                                                            <i className="fa-solid fa-plus nav-icon"></i>
                                                            <p>
                                                                {t(
                                                                    "menu.create"
                                                                )}
                                                            </p>
                                                        </Link>
                                                    </li>
                                                )}
                                            </ul>
                                        </li>
                                    )}

                                    {/* ROLE */}
                                    {can["role-list"] && (
                                        <li
                                            className={`nav-item ${
                                                (route().current(
                                                    "roles.index"
                                                ) ||
                                                    route().current(
                                                        "roles.create"
                                                    )) &&
                                                "menu-is-opening menu-open"
                                            }`}
                                        >
                                            <a
                                                href="#"
                                                className={`nav-link ${
                                                    (route().current(
                                                        "roles.index"
                                                    ) ||
                                                        route().current(
                                                            "roles.create"
                                                        )) &&
                                                    "active"
                                                }`}
                                            >
                                                <i className="nav-icon fa-solid fa-user-shield"></i>
                                                <p>
                                                    {t("menu.role")}
                                                    <i className="fas fa-angle-left right"></i>
                                                </p>
                                            </a>
                                            <ul
                                                className="nav nav-treeview"
                                                style={{
                                                    display:
                                                        route().current(
                                                            "roles.index"
                                                        ) ||
                                                        route().current(
                                                            "roles.create"
                                                        )
                                                            ? "block"
                                                            : "none",
                                                }}
                                            >
                                                <li className="nav-item">
                                                    <Link
                                                        href={route(
                                                            "roles.index"
                                                        )}
                                                        className={`nav-link ${
                                                            route().current(
                                                                "roles.index"
                                                            ) && "active"
                                                        }`}
                                                    >
                                                        <i className="fa-solid fa-list-ul nav-icon"></i>
                                                        <p>{t("menu.list")}</p>
                                                    </Link>
                                                </li>
                                                {can["role-create"] && (
                                                    <li className="nav-item">
                                                        <Link
                                                            href={route(
                                                                "roles.create"
                                                            )}
                                                            className={`nav-link ${
                                                                route().current(
                                                                    "roles.create"
                                                                ) && "active"
                                                            }`}
                                                        >
                                                            <i className="fa-solid fa-plus nav-icon"></i>
                                                            <p>
                                                                {t(
                                                                    "menu.create"
                                                                )}
                                                            </p>
                                                        </Link>
                                                    </li>
                                                )}
                                            </ul>
                                        </li>
                                    )}
                                </>
                            )}

                            {/* COMMUNICATION */}
                            {can["chat-list"] && (
                                <>
                                    <li className="nav-header">
                                        Communication
                                    </li>

                                    {/* CHAT SUPPORT */}
                                    <li className="nav-item">
                                        <Link
                                            href={route("chat.index")}
                                            className={`nav-link ${
                                                route().current("chat.index") &&
                                                "active"
                                            }`}
                                        >
                                            <i className="nav-icon fas fa-comments"></i>
                                            <p>{t("menu.chat_support")}</p>
                                        </Link>
                                    </li>
                                </>
                            )}

                            {/* SYSTEM SETTINGS */}
                            <li className="nav-header separator-after-system">
                                System Settings
                            </li>

                            {/* AUDIT LOGS */}
                            <li className="nav-item">
                                <Link
                                    href={route("audit-logs.index")}
                                    className={`nav-link ${
                                        route().current("audit-logs.index") &&
                                        "active"
                                    }`}
                                >
                                    <i className="nav-icon fas fa-history"></i>
                                    <p>{t("menu.audit_logs")}</p>
                                </Link>
                            </li>

                            {/* TELEGRAM BOT */}
                            {can["verify-list"] && (
                                <li
                                    className={`nav-item ${
                                        route().current(
                                            "telegram.verify.form"
                                        ) && "menu-is-opening menu-open"
                                    }`}
                                >
                                    <a
                                        href="#"
                                        className={`nav-link ${
                                            route().current(
                                                "telegram.verify.form"
                                            ) && "active"
                                        }`}
                                    >
                                        <i className="nav-icon fa-solid fa-robot"></i>
                                        <p>
                                            {t("menu.telegram")}
                                            <i className="fas fa-angle-left right"></i>
                                        </p>
                                    </a>
                                    <ul
                                        className="nav nav-treeview"
                                        style={{
                                            display: route().current(
                                                "telegram.verify.form"
                                            )
                                                ? "block"
                                                : "none",
                                        }}
                                    >
                                        <li className="nav-item">
                                            <Link
                                                href={route(
                                                    "telegram.verify.form"
                                                )}
                                                className={`nav-link ${
                                                    route().current(
                                                        "telegram.verify.form"
                                                    ) && "active"
                                                }`}
                                            >
                                                <i className="fa-solid fa-key nav-icon"></i>
                                                <p>{t("menu.verifyKey")}</p>
                                            </Link>
                                        </li>
                                    </ul>
                                </li>
                            )}

                            {/* PROFILE */}
                            <li className="nav-item">
                                <Link
                                    href={route("profile.edit")}
                                    className={`nav-link ${
                                        route().current("profile.edit") &&
                                        "active"
                                    }`}
                                >
                                    <i className="nav-icon fas fa-user-circle"></i>
                                    <p>{t("menu.profile")}</p>
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>
        </>
    );
}
