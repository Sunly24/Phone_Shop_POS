import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

export default function Toast({
    message,
    type = "success",
    show,
    onClose,
    duration = 5000,
}) {
    useEffect(() => {
        if (show && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [show, onClose, duration]);

    const toastVariants = {
        hidden: { opacity: 0, y: -50, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 30 },
        },
        exit: {
            opacity: 0,
            y: -50,
            scale: 0.95,
            transition: { duration: 0.2 },
        },
    };

    const typeStyles = {
        success: "bg-green-500 text-white",
        error: "bg-red-500 text-white",
        info: "bg-blue-500 text-white",
        warning: "bg-yellow-500 text-black",
    };

    const getIcon = () => {
        switch (type) {
            case "success":
                return "✅";
            case "error":
                return "❌";
            case "info":
                return "ℹ️";
            case "warning":
                return "⚠️";
            default:
                return "✅";
        }
    };

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    variants={toastVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`fixed top-4 right-4 z-[9999] px-6 py-4 rounded-lg shadow-lg max-w-sm ${typeStyles[type]}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="mr-2">{getIcon()}</span>
                            <p className="text-sm font-medium">{message}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-4 text-white hover:text-gray-200 text-lg font-bold"
                        >
                            ×
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
