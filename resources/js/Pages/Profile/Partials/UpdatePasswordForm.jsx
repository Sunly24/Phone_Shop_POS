import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import PasswordInput from "@/Components/PasswordInput";
import Toast from "@/Components/Toast";
import { Transition } from "@headlessui/react";
import { useForm } from "@inertiajs/react";
import { useRef, useState } from "react";

export default function UpdatePasswordForm({ className = "" }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    // State for toast notifications
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                // Show success toast
                setToastMessage("Password updated successfully!");
                setToastType("success");
                setShowToast(true);
            },
            onError: (errors) => {
                // Show error toast
                setToastMessage(
                    "Failed to update password. Please check your current password and try again."
                );
                setToastType("error");
                setShowToast(true);

                if (errors.password) {
                    reset("password", "password_confirmation");
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset("current_password");
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    const closeToast = () => {
        setShowToast(false);
    };

    return (
        <section className={className}>
            {/* Toast Notification */}
            <Toast
                message={toastMessage}
                type={toastType}
                show={showToast}
                onClose={closeToast}
                duration={5000}
            />

            <div>
                <p className="text-sm text-gray-600">
                    Ensure your account is using a long, random password to stay
                    secure. <br />
                </p>
            </div>
            <form onSubmit={updatePassword} className="space-y-6 mt-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    />

                    <PasswordInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) =>
                            setData("current_password", e.target.value)
                        }
                        className="block w-full"
                        autoComplete="current-password"
                        placeholder="Enter current password"
                    />

                    <InputError
                        message={errors.current_password}
                        className="mt-1"
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password"
                        value="New Password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    />

                    <PasswordInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => setData("password", e.target.value)}
                        className="block w-full"
                        autoComplete="new-password"
                        placeholder="Enter new password"
                    />

                    <InputError message={errors.password} className="mt-1" />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    />

                    <PasswordInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData("password_confirmation", e.target.value)
                        }
                        className="block w-full"
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-1"
                    />
                </div>

                <div className="flex items-center pt-4">
                    <PrimaryButton
                        disabled={processing}
                        className="bg-teal-500 hover:bg-teal-600 px-6"
                    >
                        Save
                    </PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600 ml-3">Saved.</p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
