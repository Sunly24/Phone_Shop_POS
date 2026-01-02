import { Head, Link, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import PasswordInput from "@/Components/PasswordInput";
import AccountSuspendedModal from "@/Components/AccountSuspendedModal";

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

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    // State for account suspended modal
    const [showSuspendedModal, setShowSuspendedModal] = useState(false);
    const [suspensionReason, setSuspensionReason] = useState(null);

    // Check for suspension error when errors change
    useEffect(() => {
        if (errors.suspended) {
            setSuspensionReason(errors.reason || null);
            setShowSuspendedModal(true);
        }
    }, [errors]);

    const submit = (e) => {
        e.preventDefault();
        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    const closeSuspendedModal = () => {
        setShowSuspendedModal(false);
        setSuspensionReason(null);
    };

    return (
        <GuestLayout>
            <Head title="Login" />

            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h2
                    className="text-3xl font-semibold mb-2"
                    variants={itemVariants}
                >
                    Sign In
                </motion.h2>
                <motion.p
                    className="text-gray-600 mb-8"
                    variants={itemVariants}
                >
                    Enter your email and password to sign in!
                </motion.p>

                {status && (
                    <motion.div
                        className="mb-4 text-sm font-medium text-green-600"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {status}
                    </motion.div>
                )}

                <motion.form onSubmit={submit} variants={itemVariants}>
                    <motion.div className="space-y-4" variants={formVariants}>
                        <motion.div variants={itemVariants}>
                            <motion.div
                                whileFocus={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full rounded-md border-gray-300 focus:border-blue-500"
                                    autoComplete="username"
                                    placeholder="info@gmail.com"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                />
                            </motion.div>
                            <InputError
                                message={errors.suspended ? null : errors.email}
                                className="mt-2"
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <motion.div
                                whileFocus={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full rounded-md border-gray-300 focus:border-blue-500"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                />
                            </motion.div>
                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </motion.div>

                        <motion.div
                            className="flex items-center justify-between"
                            variants={itemVariants}
                        >
                            <label className="flex items-center">
                                <Checkbox
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                />
                                <span className="ms-2 text-sm text-gray-600">
                                    Keep me logged in
                                </span>
                            </label>

                            {canResetPassword && (
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        href={route("password.request")}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </motion.div>
                            )}
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <PrimaryButton
                                    className="w-full justify-center bg-primary hover:bg-blue-600"
                                    disabled={processing}
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
                                        "Sign in"
                                    )}
                                </PrimaryButton>
                            </motion.div>
                        </motion.div>

                        {/* Divider */}
                        <motion.div
                            className="flex items-center my-6"
                            variants={itemVariants}
                        >
                            <div className="flex-1 border-t border-gray-300"></div>
                            <span className="px-4 text-sm text-gray-500">
                                Or continue with
                            </span>
                            <div className="flex-1 border-t border-gray-300"></div>
                        </motion.div>

                        {/* Google Login Button */}
                        <motion.div variants={itemVariants}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <a
                                    href={route("auth.google")}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <svg
                                        className="w-5 h-5 mr-2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Continue with Google
                                </a>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.form>

                <motion.p
                    className="mt-8 text-center text-sm text-gray-600"
                    variants={itemVariants}
                >
                    Don't have an account?{" "}
                    <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                    >
                        <Link
                            href={route("register")}
                            className="text-primary hover:underline"
                        >
                            Sign Up
                        </Link>
                    </motion.span>
                </motion.p>
            </motion.div>

            {/* Account Suspended Modal */}
            <AccountSuspendedModal
                show={showSuspendedModal}
                onClose={closeSuspendedModal}
                reason={suspensionReason}
            />
        </GuestLayout>
    );
}
