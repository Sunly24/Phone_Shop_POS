import { useState, useRef, useEffect } from "react";
import { Head, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import ApplicationLogo from "@/Components/ApplicationLogo";

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

export default function TwoFactorChallenge() {
    const [recovery, setRecovery] = useState(false);
    const codeInputRef = useRef(null);
    const recoveryCodeInputRef = useRef(null);

    const form = useForm({
        code: "",
        recovery_code: "",
    });

    // Add logging to see when this component renders
    useEffect(() => {
    }, []);

    useEffect(() => {
        if (!recovery && codeInputRef.current) {
            codeInputRef.current.focus();
        } else if (recovery && recoveryCodeInputRef.current) {
            recoveryCodeInputRef.current.focus();
        }
    }, [recovery]);

    const toggleRecovery = () => {
        if (!recovery) {
            form.setData("code", "");
        } else {
            form.setData("recovery_code", "");
        }

        setRecovery((prevState) => !prevState);
    };

    const submit = (e) => {
        e.preventDefault();

        form.post(route("two-factor.login"), {
            onSuccess: () => {
            },
            onError: (errors) => {
                
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Two-Factor Authentication" />

            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h2
                    className="text-3xl font-semibold mb-6"
                    variants={itemVariants}
                >
                    Two-Factor Authentication
                </motion.h2>

                <motion.p
                    className="text-gray-600 mb-8"
                    variants={itemVariants}
                >
                    {!recovery
                        ? "Please confirm access to your account by entering the authentication code provided by your authenticator application."
                        : "Please confirm access to your account by entering one of your emergency recovery codes."}
                </motion.p>

                <motion.form onSubmit={submit} variants={itemVariants}>
                    <motion.div className="space-y-6" variants={formVariants}>
                        {!recovery ? (
                            <motion.div variants={itemVariants}>
                                <motion.div
                                    whileFocus={{ scale: 1.02 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                    }}
                                >
                                    <InputLabel htmlFor="code" value="Code" />
                                    <TextInput
                                        id="code"
                                        ref={codeInputRef}
                                        type="text"
                                        name="code"
                                        value={form.data.code}
                                        className="mt-1 block w-full"
                                        autoComplete="one-time-code"
                                        onChange={(e) =>
                                            form.setData("code", e.target.value)
                                        }
                                    />
                                </motion.div>
                                <InputError
                                    message={form.errors.code}
                                    className="mt-2"
                                />
                            </motion.div>
                        ) : (
                            <motion.div variants={itemVariants}>
                                <motion.div
                                    whileFocus={{ scale: 1.02 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                    }}
                                >
                                    <InputLabel
                                        htmlFor="recovery_code"
                                        value="Recovery Code"
                                    />
                                    <TextInput
                                        id="recovery_code"
                                        ref={recoveryCodeInputRef}
                                        type="text"
                                        name="recovery_code"
                                        value={form.data.recovery_code}
                                        className="mt-1 block w-full"
                                        autoComplete="one-time-code"
                                        onChange={(e) =>
                                            form.setData(
                                                "recovery_code",
                                                e.target.value
                                            )
                                        }
                                    />
                                </motion.div>
                                <InputError
                                    message={form.errors.recovery_code}
                                    className="mt-2"
                                />
                            </motion.div>
                        )}

                        <motion.div
                            className="flex items-center justify-between"
                            variants={itemVariants}
                        >
                            <motion.button
                                type="button"
                                className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={toggleRecovery}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {recovery
                                    ? "Use authentication code"
                                    : "Use a recovery code"}
                            </motion.button>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <PrimaryButton
                                    disabled={form.processing}
                                    className="bg-primary hover:bg-blue-600"
                                >
                                    {form.processing ? (
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
                                        "Log in"
                                    )}
                                </PrimaryButton>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.form>
            </motion.div>
        </GuestLayout>
    );
}
