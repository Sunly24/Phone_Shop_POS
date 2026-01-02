import { Head, Link, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";

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

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("password.email"));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h1
                    className="text-3xl font-bold mb-6 text-gray-800"
                    variants={itemVariants}
                >
                    Forgot Your Password?
                </motion.h1>

                <motion.p
                    className="text-gray-600 mb-8"
                    variants={itemVariants}
                >
                    Enter the email address linked to your account, and we'll
                    send you a link to reset your password.
                </motion.p>

                {status && (
                    <motion.div
                        className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {status}
                    </motion.div>
                )}

                <motion.form onSubmit={submit} variants={itemVariants}>
                    <motion.div className="mb-6" variants={itemVariants}>
                        <motion.label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                            variants={itemVariants}
                        >
                            Email<span className="text-red-500">*</span>
                        </motion.label>
                        <motion.div
                            whileFocus={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={data.email}
                                className="w-full mt-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                autoFocus
                            />
                        </motion.div>
                        <InputError message={errors.email} className="mt-2" />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <PrimaryButton
                                type="submit"
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
                                    "Send Reset Link"
                                )}
                            </PrimaryButton>
                        </motion.div>
                    </motion.div>
                </motion.form>

                <motion.div
                    className="mt-6 text-center"
                    variants={itemVariants}
                >
                    <motion.span
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                    >
                        <Link
                            href={route("login")}
                            className="text-primary hover:underline"
                        >
                            Back to Login
                        </Link>
                    </motion.span>
                </motion.div>
            </motion.div>
        </GuestLayout>
    );
}
