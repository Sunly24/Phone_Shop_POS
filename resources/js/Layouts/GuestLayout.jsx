import { motion, AnimatePresence } from "framer-motion";
import { usePage, Link } from "@inertiajs/react";
import Lottie from "lottie-react";
import { useState, useEffect } from "react";

// Clean directional slide variants without attraction effects
const slideVariants = {
    initial: (direction) => ({
        x: direction > 0 ? 300 : -300, // From right if forward, from left if backward
        opacity: 0,
    }),
    in: {
        x: 0,
        opacity: 1,
    },
    out: (direction) => ({
        x: direction > 0 ? -300 : 300, // To left if forward, to right if backward
        opacity: 0,
    }),
};

// SLOWER page transition
const pageTransition = {
    type: "tween",
    ease: [0.25, 0.46, 0.45, 0.94], // More elegant easing curve
    duration: 0.5, // MUCH SLOWER (was 0.5, now 1.2 seconds)
};

// Configuration for each page - using external JSON files
const getPageConfig = (currentPage) => {
    const configs = {
        login: {
            animationFile: "/animations/login.json",
        },
        register: {
            animationFile: "/animations/register.json",
        },
        "forgot-password": {
            animationFile: "/animations/forget-password.json",
        },
        "reset-password": {
            animationFile: "/animations/reset-password.json",
        },
        "verify-email": {
            animationFile: "/animations/verify-email.json",
        },
        "two-factor-challenge": {
            animationFile: "/animations/2FA.json",
        },
        "confirm-password": {
            animationFile: "/animations/confirm-password.json",
        },
    };

    // Get current page from URL
    const pageName =
        Object.keys(configs).find((page) => currentPage.includes(page)) ||
        "login";
    return configs[pageName];
};

export default function GuestLayout({ children }) {
    const { url } = usePage();
    const [animationData, setAnimationData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Get current page config
    const pageConfig = getPageConfig(url);

    // Load animation data from external JSON file
    useEffect(() => {
        const loadAnimation = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(pageConfig.animationFile);
                if (response.ok) {
                    const data = await response.json();
                    setAnimationData(data);
                } else {
                    console.error(
                        `Could not load animation: ${pageConfig.animationFile}`
                    );
                    // Fallback to a simple animation or null
                    setAnimationData(null);
                }
            } catch (error) {
                setAnimationData(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadAnimation();
    }, [pageConfig.animationFile]);

    // Determine slide direction based on auth flow
    const getSlideDirection = (currentUrl) => {
        const authFlow = [
            "login",
            "register",
            "forgot-password",
            "reset-password",
            "verify-email",
            "two-factor-challenge",
            "confirm-password",
        ];

        const currentIndex = authFlow.findIndex((path) =>
            currentUrl.includes(path)
        );

        // Store previous index to determine direction
        const prevIndex = parseInt(
            sessionStorage.getItem("prevAuthIndex") || "0"
        );
        sessionStorage.setItem("prevAuthIndex", currentIndex.toString());

        // Return 1 for forward (right to left), -1 for backward (left to right)
        return currentIndex > prevIndex ? 1 : -1;
    };

    const direction = getSlideDirection(url);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gray-50">
            {/* Logo in top right */}
            <motion.div
                className="absolute top-6 right-6 z-20"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                <Link href="/">
                    <img
                        src="/images/brand-logo/blue-logo.png"
                        alt="Phone Store Logo"
                        className="h-16 w-auto"
                    />
                </Link>
            </motion.div>

            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={url}
                    custom={direction}
                    variants={slideVariants}
                    initial="initial"
                    animate="in"
                    exit="out"
                    transition={pageTransition}
                    className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-6xl flex min-h-[600px] relative z-10 border border-gray-200"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.4, // Slower entrance delay
                            duration: 0.8, // SLOWER content fade (was 0.4, now 0.8)
                            ease: "easeOut",
                        }}
                        className="w-full lg:w-1/2 p-8 lg:p-12"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                delay: 0.7, // Even slower for form content
                                duration: 0.9, // SLOWER form animation
                                ease: "easeOut",
                            }}
                            className="w-full max-w-[420px] mx-auto"
                        >
                            {children}
                        </motion.div>
                    </motion.div>

                    {/* Right side - LOTTIE ANIMATIONS FROM EXTERNAL FILES */}
                    <div className="hidden lg:block relative w-1/2 min-h-[600px] bg-[#BDD7E7] overflow-hidden">
                        <div className="flex items-center justify-center h-full">
                            {/* Subtle background particles */}
                            <div className="absolute inset-0">
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={`bg-particle-${i}`}
                                        className="absolute w-2 h-2 bg-white/10 rounded-full"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`,
                                        }}
                                        animate={{
                                            y: [0, -30, 0],
                                            opacity: [0.1, 0.3, 0.1],
                                        }}
                                        transition={{
                                            duration: 8 + Math.random() * 4,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: Math.random() * 3,
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Main Lottie Animation Content */}
                            <motion.div
                                className="text-center text-white p-8 relative z-10"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: 1.0, // Much later entrance
                                    duration: 1.2, // SLOWER brand content
                                    ease: "easeOut",
                                }}
                            >
                                {/* Lottie Animation Container */}
                                <motion.div
                                    className="mb-8 mx-auto w-80 h-80 flex items-center justify-center"
                                    key={url} // Re-mount when URL changes
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        duration: 1.0,
                                        ease: "backOut",
                                        delay: 0.5,
                                    }}
                                >
                                    <div className="w-full h-full flex items-center justify-center">
                                        {isLoading ? (
                                            // Loading spinner while animation loads
                                            <motion.div
                                                className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    ease: "linear",
                                                }}
                                            />
                                        ) : animationData ? (
                                            // Render Lottie animation from external file
                                            <Lottie
                                                animationData={animationData}
                                                loop={true}
                                                autoplay={true}
                                                style={{
                                                    width: "100%",
                                                    height: "100%",
                                                    filter: "drop-shadow(0 0 20px rgba(255,255,255,0.3))",
                                                }}
                                            />
                                        ) : (
                                            // Fallback if animation fails to load
                                            <motion.div
                                                className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center"
                                                animate={{
                                                    scale: [1, 1.1, 1],
                                                    rotate: [0, 360],
                                                }}
                                                transition={{
                                                    scale: {
                                                        duration: 2,
                                                        repeat: Infinity,
                                                        ease: "easeInOut",
                                                    },
                                                    rotate: {
                                                        duration: 8,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                    },
                                                }}
                                            >
                                                <div className="w-16 h-20 bg-white/40 rounded-lg"></div>
                                            </motion.div>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
