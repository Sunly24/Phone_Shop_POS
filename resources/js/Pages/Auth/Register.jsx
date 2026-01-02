import { Head, Link, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import { useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
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

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        terms: false,
    });

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");

    const submit = (e) => {
        e.preventDefault();

        // Client-side validation for terms acceptance
        if (!data.terms) {
            setToastMessage(
                "⚠️ Please accept the Terms and Conditions to continue."
            );
            setToastType("error");
            setShowToast(true);
            return;
        }

        post(route("register"), {
            onSuccess: () => {
                setToastMessage(
                    "🎉 Account created successfully! Welcome to Phone Shop! Admins have been notified."
                );
                setToastType("success");
                setShowToast(true);
                reset("password", "password_confirmation");
            },
            onError: () => {
                setToastMessage(
                    "❌ Registration failed. Please check your details and try again."
                );
                setToastType("error");
                setShowToast(true);
            },
            onFinish: () => reset("password", "password_confirmation"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Register" />

            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h2
                    className="text-3xl font-semibold mb-2"
                    variants={itemVariants}
                >
                    Create Account
                </motion.h2>
                <motion.p
                    className="text-gray-600 mb-8"
                    variants={itemVariants}
                >
                    Enter your details to get started!
                </motion.p>

                <motion.form onSubmit={submit} variants={itemVariants}>
                    <motion.div className="space-y-4" variants={formVariants}>
                        {/* Name Field */}
                        <motion.div variants={itemVariants}>
                            <motion.div
                                whileFocus={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <TextInput
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={data.name}
                                    className="mt-1 block w-full rounded-md border-gray-300 focus:border-blue-500"
                                    autoComplete="name"
                                    placeholder="Enter your full name"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData("name", e.target.value)
                                    }
                                    required
                                />
                            </motion.div>
                            <InputError
                                message={errors.name}
                                className="mt-2"
                            />
                        </motion.div>

                        {/* Email Field */}
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
                                    placeholder="Enter your email"
                                    onChange={(e) =>
                                        setData("email", e.target.value)
                                    }
                                    required
                                />
                            </motion.div>
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </motion.div>

                        {/* Password Field */}
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
                                    autoComplete="new-password"
                                    placeholder="Create a strong password"
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    required
                                />
                            </motion.div>
                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </motion.div>

                        {/* Confirm Password Field */}
                        <motion.div variants={itemVariants}>
                            <motion.div
                                whileFocus={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    value={data.password_confirmation}
                                    className="mt-1 block w-full rounded-md border-gray-300 focus:border-blue-500"
                                    autoComplete="new-password"
                                    placeholder="Confirm your password"
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value
                                        )
                                    }
                                    required
                                />
                            </motion.div>
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </motion.div>

                        {/* Terms & Conditions Checkbox */}
                        <motion.div
                            className="flex items-start"
                            variants={itemVariants}
                        >
                            <div className="flex items-center h-5">
                                <input
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    checked={data.terms}
                                    onChange={(e) =>
                                        setData("terms", e.target.checked)
                                    }
                                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    required
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label
                                    htmlFor="terms"
                                    className="text-gray-600"
                                >
                                    By creating an account means you agree to
                                    the{" "}
                                    <a
                                        href="/terms"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Terms and Conditions
                                    </a>
                                    , and our{" "}
                                    <a
                                        href="/privacy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        Privacy Policy
                                    </a>
                                </label>
                            </div>
                        </motion.div>
                        <InputError message={errors.terms} className="mt-2" />

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
                                        "Create Account"
                                    )}
                                </PrimaryButton>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.form>

                <motion.p
                    className="mt-8 text-center text-sm text-gray-600"
                    variants={itemVariants}
                >
                    Already have an account?{" "}
                    <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                    >
                        <Link
                            href={route("login")}
                            className="text-primary hover:underline"
                        >
                            Sign In
                        </Link>
                    </motion.span>
                </motion.p>
            </motion.div>

            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
        </GuestLayout>
    );
}
