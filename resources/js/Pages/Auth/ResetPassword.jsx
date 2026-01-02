import { Head, Link, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import { useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import PasswordInput from "@/Components/PasswordInput";
import Toast from "@/Components/Toast";

// Form animation variants
const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: "easeOut" },
    },
};

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: "",
        password_confirmation: "",
    });

    // State for toast notification
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");

    const submit = (e) => {
        e.preventDefault();

        post(route("password.store"), {
            onSuccess: () => {
                // Show success toast
                setToastMessage(
                    "Password has been reset successfully! Redirecting to login..."
                );
                setToastType("success");
                setShowToast(true);

                // Redirect to login after showing the toast for 3 seconds
                setTimeout(() => {
                    window.location.href = route("login");
                }, 3000);
            },
            onError: () => {
                // Show error toast if there are validation errors
                setToastMessage(
                    "Failed to reset password. Please check your input and try again."
                );
                setToastType("error");
                setShowToast(true);
            },
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    const closeToast = () => {
        setShowToast(false);
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            {/* Toast Notification */}
            <Toast
                message={toastMessage}
                type={toastType}
                show={showToast}
                onClose={closeToast}
                duration={5000}
            />

            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h1
                    className="text-3xl font-bold mb-6 text-gray-800"
                    variants={itemVariants}
                >
                    Reset Password
                </motion.h1>

                <motion.p
                    className="text-gray-600 mb-8"
                    variants={itemVariants}
                >
                    Please create a new secure password for your account.
                </motion.p>

                <motion.form onSubmit={submit} variants={itemVariants}>
                    <motion.div className="space-y-6" variants={formVariants}>
                        <motion.div variants={itemVariants}>
                            <motion.label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 mb-1"
                                variants={itemVariants}
                            >
                                Email<span className="text-red-500">*</span>
                            </motion.label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                readOnly
                                className="w-full mt-1 block rounded-md border border-gray-300 bg-gray-50"
                                autoComplete="username"
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <motion.label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 mb-1"
                                variants={itemVariants}
                            >
                                New Password
                                <span className="text-red-500">*</span>
                            </motion.label>
                            <motion.div
                                whileFocus={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    placeholder="Enter new password"
                                    value={data.password}
                                    className="w-full mt-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    autoFocus
                                />
                            </motion.div>
                            <div className="mt-2 text-sm text-gray-600">
                                <p className="mb-1">Password must contain:</p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li>At least 8 characters</li>
                                    <li>At least one uppercase letter (A-Z)</li>
                                    <li>At least one lowercase letter (a-z)</li>
                                    <li>At least one number (0-9)</li>
                                    <li>
                                        At least one special character
                                        (!@#$%^&*)
                                    </li>
                                    <li>
                                        Must not be a commonly used password
                                    </li>
                                </ul>
                            </div>
                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <motion.label
                                htmlFor="password_confirmation"
                                className="block text-sm font-medium text-gray-700 mb-1"
                                variants={itemVariants}
                            >
                                Confirm Password
                                <span className="text-red-500">*</span>
                            </motion.label>
                            <motion.div
                                whileFocus={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    placeholder="Confirm new password"
                                    value={data.password_confirmation}
                                    className="w-full mt-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    autoComplete="new-password"
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value
                                        )
                                    }
                                />
                            </motion.div>
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <PrimaryButton
                                    disabled={processing}
                                    className="w-full justify-center bg-primary hover:bg-blue-600"
                                >
                                    {processing ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                ease: "linear",
                                            }}
                                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                        />
                                    ) : (
                                        "Reset Password"
                                    )}
                                </PrimaryButton>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.form>

                <motion.div
                    className="mt-6 text-center"
                    variants={itemVariants}
                >
                    <motion.span className="text-gray-600">
                        Remember your password?{" "}
                    </motion.span>
                    <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                    >
                        <Link
                            href={route("login")}
                            className="text-blue-600 hover:underline"
                        >
                            Back to login
                        </Link>
                    </motion.span>
                </motion.div>
            </motion.div>
        </GuestLayout>
    );
}
