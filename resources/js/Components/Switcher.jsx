import React, { useState, useEffect, useRef } from "react";
import {
    FaGlobe,
    FaMoon,
    FaSun,
    FaPalette,
    FaChevronDown,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { US, KH, CN } from "country-flag-icons/react/3x2";

const Switcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [currentTheme, setCurrentTheme] = useState("light");
    const [currentLanguage, setCurrentLanguage] = useState(
        i18n.language || "en"
    );
    const dropdownRef = useRef(null);

    // Available languages with flag components
    const languages = [
        { code: "en", name: "English", icon: US, className: "w-5 h-5" },
        { code: "kh", name: "ខ្មែរ", icon: KH, className: "w-5 h-5" },
        { code: "zh", name: "中文", icon: CN, className: "w-5 h-5" },
    ];

    // Available themes
    const themes = [
        { key: "light", name: "Light", icon: FaSun, color: "text-yellow-500" },
        { key: "dark", name: "Dark", icon: FaMoon, color: "text-indigo-400" },
        {
            key: "auto",
            name: "Auto",
            icon: FaPalette,
            color: "text-purple-500",
        },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Initialize theme from localStorage and system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        const savedLanguage = localStorage.getItem("language") || "en";

        setCurrentTheme(savedTheme);
        setCurrentLanguage(savedLanguage);
        i18n.changeLanguage(savedLanguage);
        document.documentElement.setAttribute("data-lang", savedLanguage);
        applyTheme(savedTheme);
    }, [i18n]); // Apply theme to document
    const applyTheme = (theme) => {
        const root = document.documentElement;
        localStorage.setItem("theme", theme);

        // Remove existing theme classes
        root.classList.remove("dark");

        if (theme === "dark") {
            root.classList.add("dark");
        } else if (theme === "light") {
            // Light theme - no class needed
        } else if (theme === "auto") {
            // Handle system preference changes
            const mediaQuery = window.matchMedia(
                "(prefers-color-scheme: dark)"
            );
            const handler = () => {
                root.classList.remove("dark");
                if (mediaQuery.matches) {
                    root.classList.add("dark");
                }
            };

            handler(); // Initial check
            mediaQuery.addEventListener("change", handler);

            // Store cleanup function
            window.themeCleanup = () =>
                mediaQuery.removeEventListener("change", handler);
        }

        // Clear any existing theme cleanup
        if (window.themeCleanup && theme !== "auto") {
            window.themeCleanup();
            window.themeCleanup = null;
        }
    };

    // Handle language change with font handling
    const handleLanguageChange = (langCode) => {
        try {
            // Change language in i18n
            i18n.changeLanguage(langCode);
            setCurrentLanguage(langCode);
            localStorage.setItem("language", langCode);

            // Set both HTML attributes
            document.documentElement.setAttribute("lang", langCode);
            document.documentElement.setAttribute("data-lang", langCode);

            // Force a reflow to ensure proper font application
            const html = document.documentElement;
            html.style.display = "none";
            html.offsetHeight; // Force reflow
            html.style.display = "";

            setIsOpen(false);
        } catch (error) {
            // Error changing language - silent fail in production
        }
        setIsOpen(false);
    }; // Handle theme change
    const handleThemeChange = (theme) => {
        setCurrentTheme(theme);
        applyTheme(theme);
        setIsOpen(false);
    };

    const getCurrentLanguage = () => {
        return (
            languages.find((lang) => lang.code === currentLanguage) ||
            languages[0]
        );
    };

    const getCurrentTheme = () => {
        return themes.find((theme) => theme.key === currentTheme) || themes[0];
    };

    return (
        <div className="relative ml-2" ref={dropdownRef}>
            <button
                className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Language and theme switcher"
            >
                <div className="flex items-center space-x-1">
                    <FaGlobe className="text-gray-600 text-lg" />
                    <FaChevronDown
                        className={`text-gray-500 text-xs transition-transform duration-200 ${
                            isOpen ? "transform rotate-180" : ""
                        }`}
                    />
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Language Section */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <FaGlobe className="mr-2" />
                            <span>Language</span>
                        </div>
                        <div className="mt-1 space-y-1">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                        currentLanguage === lang.code
                                            ? "bg-blue-500 text-white"
                                            : "text-gray-700 hover:bg-gray-200"
                                    }`}
                                    onClick={() =>
                                        handleLanguageChange(lang.code)
                                    }
                                >
                                    {lang.icon && (
                                        <lang.icon
                                            className={`mr-2 ${lang.className}`}
                                        />
                                    )}
                                    <span>{lang.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Section */}
                    <div className="p-3">
                        <div className="flex items-center px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                            <FaPalette className="mr-2" />
                            <span>Theme</span>
                        </div>
                        <div className="mt-1 space-y-1">
                            {themes.map((theme) => {
                                const IconComponent = theme.icon;
                                return (
                                    <button
                                        key={theme.key}
                                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                                            currentTheme === theme.key
                                                ? "bg-blue-500 text-white"
                                                : "text-gray-700 hover:bg-gray-200"
                                        }`}
                                        onClick={() =>
                                            handleThemeChange(theme.key)
                                        }
                                    >
                                        <IconComponent
                                            className={`mr-2 ${theme.color}`}
                                        />
                                        <span>{theme.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Switcher;
