import { Head, Link, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import GuestLayout from "@/Layouts/GuestLayout";
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

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route("verification.send"));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h2
                    className="text-3xl font-semibold mb-6"
                    variants={itemVariants}
                >
                    Verify Your Email
                </motion.h2>

                <motion.p
                    className="text-gray-600 mb-8"
                    variants={itemVariants}
                >
                    Thanks for signing up! Before getting started, could you
                    verify your email address by clicking on the link we just
                    emailed to you? If you didn't receive the email, we will
                    gladly send you another.
                </motion.p>

                {status === "verification-link-sent" && (
                    <motion.div
                        className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        A new verification link has been sent to the email
                        address you provided during registration.
                    </motion.div>
                )}

                <motion.form onSubmit={submit} variants={itemVariants}>
                    <motion.div
                        className="mt-4 flex items-center justify-between"
                        variants={formVariants}
                    >
                        <motion.div variants={itemVariants}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <PrimaryButton
                                    disabled={processing}
                                    className="bg-primary hover:bg-blue-600"
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
                                        "Resend Verification Email"
                                    )}
                                </PrimaryButton>
                            </motion.div>
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <motion.span
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-block"
                            >
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Log Out
                                </Link>
                            </motion.span>
                        </motion.div>
                    </motion.div>
                </motion.form>
            </motion.div>
        </GuestLayout>
    );
}
