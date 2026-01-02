import { useEffect, useRef, useState } from "react";
import { router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import ActionSection from "@/Components/ActionSection";
import DialogModal from "@/Components/DialogModal";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import DangerButton from "@/Components/DangerButton";

export default function TwoFactorAuthenticationForm({
    requiresConfirmation = false,
    className = "",
}) {
    const page = usePage();
    const [enabling, setEnabling] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [disabling, setDisabling] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [setupKey, setSetupKey] = useState(null);
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [showingRecoveryCodes, setShowingRecoveryCodes] = useState(false);
    const [qrError, setQrError] = useState(null);
    const [showEnableDialog, setShowEnableDialog] = useState(false);
    const [showDisableDialog, setShowDisableDialog] = useState(false);
    const passwordRef = useRef();

    const form = useForm({
        password: "",
    });

    const confirmationForm = useForm({
        code: "",
    });

    // Create a safe reference to the auth user
    const user =
        page.props.auth && page.props.auth.user ? page.props.auth.user : {};

    // Safely check if 2FA is enabled
    const twoFactorEnabled =
        !enabling &&
        (user && typeof user.two_factor_enabled !== "undefined"
            ? user.two_factor_enabled
            : false);

    useEffect(() => {
        if (!twoFactorEnabled) {
            form.reset();
            form.clearErrors();
        }
    }, [twoFactorEnabled]);

    function enableTwoFactorAuthentication() {
        try {
            setEnabling(true);

            router.post(
                route("two-factor.enable"),
                {},
                {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        try {
                            // Use a slight delay to ensure the server has time to process
                            setTimeout(() => {
                                try {
                                    // First get the QR code
                                    showQrCode()
                                        .then(() => {
                                            // Then get the setup key
                                            return showSetupKey();
                                        })
                                        .then(() => {
                                            // Then get recovery codes
                                            return showRecoveryCodes();
                                        })
                                        .then(() => {
                                            setConfirming(requiresConfirmation);
                                        })
                                        .catch((error) => {
                                            // Failed to load 2FA data - silent fail in production
                                        });
                                } catch (e) {
                                    // Error in timeout callback - silent fail in production
                                }
                            }, 500); // Increased timeout to 500ms
                        } catch (e) {
                            // Error in onSuccess callback - silent fail in production
                        }
                    },
                    onFinish: () => {
                        setEnabling(false);
                    },
                    onError: (errors) => {
                        setEnabling(false);
                    },
                }
            );
        } catch (e) {
            setEnabling(false);
        }
    }

    function showQrCode() {
        setQrError(null); // Clear any previous errors

        return new Promise((resolve, reject) => {
            axios
                .get(route("two-factor.custom-qr-code"))
                .then((response) => {
                    if (response.data && response.data.svg) {
                        setQrCode(response.data.svg);
                        resolve();
                    } else {
                        setQrError("QR code data not found in response");
                        reject(new Error("Invalid QR code response"));
                    }
                })
                .catch((error) => {
                    // Try fallback to default Fortify QR route
                    axios
                        .get(route("two-factor.qr-code"))
                        .then((response) => {
                            if (response.data) {
                                // Fortify returns SVG directly as text
                                setQrCode(response.data);
                                resolve();
                            } else {
                                setQrError(
                                    "Failed to generate QR code from both endpoints"
                                );
                                reject(new Error("Both QR endpoints failed"));
                            }
                        })
                        .catch((fallbackError) => {
                            // Set a user-friendly error message
                            if (
                                error.response &&
                                error.response.data &&
                                error.response.data.error
                            ) {
                                setQrError(error.response.data.error);
                            } else {
                                setQrError(
                                    "Failed to generate QR code. Try again later."
                                );
                            }
                            reject(fallbackError);
                        });
                });
        });
    }

    function showSetupKey() {
        return new Promise((resolve, reject) => {
            axios
                .get(route("two-factor.secret-key"))
                .then((response) => {
                    if (response.data && response.data.secretKey) {
                        setSetupKey(response.data.secretKey);
                        resolve();
                    } else {
                        reject(new Error("Invalid setup key response"));
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    function showRecoveryCodes() {
        return new Promise((resolve, reject) => {
            axios
                .get(route("two-factor.recovery-codes"))
                .then((response) => {
                    if (Array.isArray(response.data)) {
                        setRecoveryCodes(response.data);
                        resolve();
                    } else {
                        reject(new Error("Invalid recovery codes response"));
                    }
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    function confirmTwoFactorAuthentication() {
        confirmationForm.post(route("two-factor.confirm"), {
            errorBag: "confirmTwoFactorAuthentication",
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setConfirming(false);
                setQrCode(null);
                setSetupKey(null);
            },
        });
    }

    function regenerateRecoveryCodes() {
        axios
            .post(route("two-factor.recovery-codes"))
            .then(() => showRecoveryCodes());
    }

    function disableTwoFactorAuthentication() {
        setDisabling(true);

        router.delete(route("two-factor.disable"), {
            preserveScroll: true,
            onSuccess: () => {
                setDisabling(false);
                setConfirming(false);
            },
        });
    }

    function handleEnableTwoFactor() {
        setShowEnableDialog(true);
        setTimeout(() => passwordRef.current?.focus(), 250);
    }

    function handleDisableTwoFactor() {
        setShowDisableDialog(true);
        setTimeout(() => passwordRef.current?.focus(), 250);
    }

    function confirmEnableTwoFactor() {
        form.post(route("password.confirm"), {
            preserveScroll: true,
            onSuccess: () => {
                setShowEnableDialog(false);
                enableTwoFactorAuthentication();
                form.reset();
            },
            onError: () => {
                passwordRef.current?.focus();
            },
        });
    }

    function confirmDisableTwoFactor() {
        form.post(route("password.confirm"), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDisableDialog(false);
                disableTwoFactorAuthentication();
                form.reset();
            },
            onError: () => {
                passwordRef.current?.focus();
            },
        });
    }

    function closeEnableModal() {
        setShowEnableDialog(false);
        form.reset();
    }

    function closeDisableModal() {
        setShowDisableDialog(false);
        form.reset();
    }

    const [showRecoveryCodesDialog, setShowRecoveryCodesDialog] =
        useState(false);

    const showRecoveryCodesHandler = () => {
        setShowRecoveryCodesDialog(true);
        setTimeout(() => passwordRef.current?.focus(), 250);
    };

    function confirmShowRecoveryCodes() {
        form.post(route("password.confirm"), {
            preserveScroll: true,
            onSuccess: () => {
                setShowRecoveryCodesDialog(false);
                setShowingRecoveryCodes(true);
                if (recoveryCodes.length === 0) {
                    axios
                        .get(route("two-factor.recovery-codes"))
                        .then((response) => {
                            setRecoveryCodes(response.data);
                        });
                }
                form.reset();
            },
            onError: () => {
                passwordRef.current?.focus();
            },
        });
    }

    function closeRecoveryCodesDialog() {
        setShowRecoveryCodesDialog(false);
        form.reset();
    }

    return (
        <section className={className}>
            <DialogModal
                show={showEnableDialog}
                onClose={closeEnableModal}
                title="Enable Two Factor Authentication"
                content={
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Please enter your password to confirm you would like
                            to enable two factor authentication.
                        </p>
                        <div>
                            <TextInput
                                ref={passwordRef}
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData("password", e.target.value)
                                }
                                type="password"
                                className="block w-full"
                                placeholder="Password"
                                autoComplete="current-password"
                            />
                            <InputError
                                message={form.errors.password}
                                className="mt-1"
                            />
                        </div>
                    </div>
                }
                footer={
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={closeEnableModal}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={form.processing}
                            onClick={confirmEnableTwoFactor}
                            className="bg-primary hover:bg-primary/90"
                        >
                            Enable
                        </PrimaryButton>
                    </div>
                }
            />

            <DialogModal
                show={showDisableDialog}
                onClose={closeDisableModal}
                title="Disable Two Factor Authentication"
                content={
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Please enter your password to confirm you would like
                            to disable two factor authentication.
                        </p>
                        <div>
                            <TextInput
                                ref={passwordRef}
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData("password", e.target.value)
                                }
                                type="password"
                                className="block w-full"
                                placeholder="Password"
                                autoComplete="current-password"
                            />
                            <InputError
                                message={form.errors.password}
                                className="mt-1"
                            />
                        </div>
                    </div>
                }
                footer={
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={closeDisableModal}>
                            Cancel
                        </SecondaryButton>
                        <DangerButton
                            disabled={form.processing}
                            onClick={confirmDisableTwoFactor}
                        >
                            Disable
                        </DangerButton>
                    </div>
                }
            />

            <DialogModal
                show={showRecoveryCodesDialog}
                onClose={closeRecoveryCodesDialog}
                title="Show Recovery Codes"
                content={
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Please enter your password to view your two factor
                            authentication recovery codes.
                        </p>
                        <div>
                            <TextInput
                                ref={passwordRef}
                                value={form.data.password}
                                onChange={(e) =>
                                    form.setData("password", e.target.value)
                                }
                                type="password"
                                className="block w-full"
                                placeholder="Password"
                                autoComplete="current-password"
                            />
                            <InputError
                                message={form.errors.password}
                                className="mt-1"
                            />
                        </div>
                    </div>
                }
                footer={
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={closeRecoveryCodesDialog}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={form.processing}
                            onClick={confirmShowRecoveryCodes}
                            className="bg-primary hover:bg-primary/90"
                        >
                            Show Recovery Codes
                        </PrimaryButton>
                    </div>
                }
            />

            {!twoFactorEnabled ? (
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            When two factor authentication is enabled, you will
                            be prompted for a secure, random token during
                            authentication. You may retrieve this token from
                            your phone's authenticator application.
                        </p>
                    </div>
                    <div>
                        <PrimaryButton
                            onClick={handleEnableTwoFactor}
                            className="bg-primary hover:bg-primary/90"
                            disabled={enabling}
                        >
                            {enabling ? "Processing..." : "Enable"}
                        </PrimaryButton>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="text-sm text-gray-600">
                                Two factor authentication is now enabled. Scan
                                the following QR code using your phone's
                                authenticator application.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <PrimaryButton
                                onClick={showRecoveryCodesHandler}
                                className="bg-primary hover:bg-primary/90 te"
                            >
                                Codes
                            </PrimaryButton>
                            <DangerButton
                                onClick={handleDisableTwoFactor}
                                disabled={disabling}
                            >
                                {disabling ? "Disabling..." : "Disable"}
                            </DangerButton>
                        </div>
                    </div>

                    {qrCode && (
                        <div className="mt-4 p-4 bg-gray-50 border border-gray-200">
                            <div className="flex justify-center mb-2">
                                <div
                                    dangerouslySetInnerHTML={{ __html: qrCode }}
                                    className="bg-white p-2"
                                />
                            </div>
                            {setupKey && (
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Setup Key:
                                    </p>
                                    <p className="text-sm bg-gray-100 font-mono p-2 rounded-sm">
                                        {setupKey}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {qrError && (
                        <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm border border-red-200">
                            {qrError}
                        </div>
                    )}

                    {showingRecoveryCodes && recoveryCodes.length > 0 && (
                        <div className="mt-6">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-gray-600">
                                    Store these recovery codes in a secure
                                    password manager. They can be used to
                                    recover access to your account if your two
                                    factor authentication device is lost.
                                </p>
                                <PrimaryButton
                                    onClick={regenerateRecoveryCodes}
                                    className="bg-teal-500 hover:bg-teal-600 ml-4 whitespace-nowrap"
                                >
                                    Regenerate
                                </PrimaryButton>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 p-2 mt-2">
                                <div className="grid grid-cols-1 gap-1">
                                    {recoveryCodes.map((code) => (
                                        <div
                                            key={code}
                                            className="text-s font-mono "
                                        >
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {confirming && (
                        <div className="mt-4">
                            <div className="mb-4">
                                <InputLabel
                                    htmlFor="code"
                                    value="Code"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                />
                                <TextInput
                                    id="code"
                                    type="text"
                                    name="code"
                                    className="block w-full"
                                    value={confirmationForm.data.code}
                                    onChange={(e) =>
                                        confirmationForm.setData(
                                            "code",
                                            e.target.value
                                        )
                                    }
                                    autoComplete="one-time-code"
                                />
                                <InputError
                                    message={confirmationForm.errors.code}
                                    className="mt-1"
                                />
                            </div>
                            <PrimaryButton
                                onClick={confirmTwoFactorAuthentication}
                                disabled={confirmationForm.processing}
                                className="bg-teal-500 hover:bg-teal-600"
                            >
                                Confirm
                            </PrimaryButton>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
