import { useEffect, useRef } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import { motion } from "framer-motion";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";

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

export default function ConfirmPassword() {
    const passwordInput = useRef();
    const { data, setData, post, processing, errors, reset } = useForm({
        password: "",
    });

    useEffect(() => {
        if (passwordInput.current) {
            passwordInput.current.focus();
        }
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("password.confirm"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <motion.div
                variants={formVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.h2
                    className="text-3xl font-semibold mb-6"
                    variants={itemVariants}
                >
                    Confirm Password
                </motion.h2>

                <motion.p
                    className="text-gray-600 mb-8"
                    variants={itemVariants}
                >
                    This is a secure area of the application. Please confirm
                    your password before continuing.
                </motion.p>

                <motion.form onSubmit={submit} variants={itemVariants}>
                    <motion.div className="space-y-6" variants={formVariants}>
                        <motion.div variants={itemVariants}>
                            <motion.div
                                whileFocus={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <InputLabel
                                    htmlFor="password"
                                    value="Password"
                                />
                                <TextInput
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    ref={passwordInput}
                                />
                            </motion.div>
                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </motion.div>

                        <motion.div
                            className="flex items-center justify-end"
                            variants={itemVariants}
                        >
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
                                        "Confirm"
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
