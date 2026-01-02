import { useRef, useState } from "react";
import { useForm } from "@inertiajs/react";
import DialogModal from "./DialogModal";
import InputError from "./InputError";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import TextInput from "./TextInput";

export default function ConfirmsPassword({ children, onConfirm }) {
    const [confirmingPassword, setConfirmingPassword] = useState(false);
    const form = useForm({ password: "" });
    const passwordRef = useRef();

    function startConfirmingPassword() {
        setConfirmingPassword(true);

        setTimeout(() => {
            if (passwordRef.current) {
                passwordRef.current.focus();
            }
        }, 250);
    }

    function confirmPassword() {
        try {
            form.post(route("password.confirm"), {
                preserveScroll: true,
                onSuccess: () => {
                    try {
                        form.reset();
                        onConfirm();
                    } catch (e) {
                    }
                },
                onError: (errors) => {
                    
                    if (passwordRef.current) {
                        passwordRef.current.focus();
                    }
                },
            });
        } catch (e) {
            
        }
    }

    function closeModal() {
        setConfirmingPassword(false);
        form.reset();
    }

    return (
        <div>
            <div onClick={startConfirmingPassword}>{children}</div>

            <DialogModal
                show={confirmingPassword}
                onClose={closeModal}
                title="Confirm Password"
                content={
                    <>
                        <div className="mt-4 text-sm text-gray-600">
                            For your security, please confirm your password to
                            continue.
                        </div>

                        <div className="mt-4">
                            <TextInput
                                ref={passwordRef}
                                type="password"
                                className="mt-1 block w-3/4"
                                placeholder="Password"
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData(
                                        "password",
                                        e.currentTarget.value
                                    )
                                }
                                onKeyUp={(e) =>
                                    e.key === "Enter" && confirmPassword()
                                }
                            />

                            <InputError
                                message={form.errors.password}
                                className="mt-2"
                            />
                        </div>
                    </>
                }
                footer={
                    <>
                        <SecondaryButton onClick={closeModal}>
                            Cancel
                        </SecondaryButton>

                        <PrimaryButton
                            className="ml-3"
                            disabled={form.processing}
                            onClick={confirmPassword}
                        >
                            Confirm
                        </PrimaryButton>
                    </>
                }
            />
        </div>
    );
}
