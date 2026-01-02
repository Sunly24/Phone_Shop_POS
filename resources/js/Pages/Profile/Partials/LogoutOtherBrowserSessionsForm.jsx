import React, { useRef, useState } from "react";
import { useForm } from "@inertiajs/react";
import ActionMessage from "@/Components/ActionMessage";
import DialogModal from "@/Components/DialogModal";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";

export default function LogoutOtherBrowserSessionsForm({
    sessions,
    className = "",
}) {
    const [confirmingLogout, setConfirmingLogout] = useState(false);
    const passwordRef = useRef();

    const form = useForm({
        password: "",
    });

    function confirmLogout() {
        setConfirmingLogout(true);
        setTimeout(() => passwordRef.current?.focus(), 250);
    }

    function logoutOtherBrowserSessions() {
        form.delete(route("other-browser-sessions.destroy"), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordRef.current?.focus(),
            onFinish: () => form.reset(),
        });
    }

    function closeModal() {
        setConfirmingLogout(false);
        form.reset();
    }

    function getBrowserName(browser) {
        if (!browser) return "Unknown";
        const lowerBrowser = browser.toLowerCase();
        if (lowerBrowser.includes("opr") || lowerBrowser.includes("opera"))
            return "Opera GX";
        if (lowerBrowser.includes("firefox")) return "Firefox";
        if (lowerBrowser.includes("edge")) return "Edge";
        if (lowerBrowser.includes("safari") && !lowerBrowser.includes("chrome"))
            return "Safari";
        if (lowerBrowser.includes("chrome")) return "Chrome";
        return browser;
    }

    return (
        <section className={className}>
            <div>
                <div className="space-y-4">
                    {sessions.map((session, i) => (
                        <div
                            key={i}
                            className="flex items-center border border-gray-100 p-3"
                        >
                            <div>
                                {session.agent.is_desktop ? (
                                    <svg
                                        className="w-7 h-7 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-7 h-7 text-gray-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth="1.5"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                                        />
                                    </svg>
                                )}
                            </div>

                            <div className="ml-3">
                                <div className="text-sm font-medium">
                                    {session.agent.platform || "Unknown"} -{" "}
                                    {getBrowserName(session.agent.browser)}
                                </div>

                                <div className="text-xs text-gray-500">
                                    {session.ip_address}
                                    {session.is_current_device && (
                                        <span className="text-green-500 ml-1">
                                            This device
                                        </span>
                                    )}
                                    {!session.is_current_device && (
                                        <span className="ml-1">
                                            Last active {session.last_active}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600 mr-4">
                        If necessary, you may log out of all other browser
                        sessions across all your devices.
                    </div>
                    <PrimaryButton
                        onClick={confirmLogout}
                        className="bg-teal-500 hover:bg-teal-600 px-6 whitespace-nowrap"
                    >
                        Log Out Sessions
                    </PrimaryButton>
                </div>

                <ActionMessage
                    on={form.recentlySuccessful}
                    className="mt-2 text-sm"
                >
                    Done.
                </ActionMessage>
            </div>

            <DialogModal
                show={confirmingLogout}
                onClose={closeModal}
                title="Log Out Other Browser Sessions"
                content={
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Please enter your password to confirm you would like
                            to log out of your other browser sessions.
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
                        <SecondaryButton onClick={closeModal}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton
                            disabled={form.processing}
                            onClick={logoutOtherBrowserSessions}
                            className="bg-teal-500 hover:bg-teal-600"
                        >
                            Log Out Other Browser Sessions
                        </PrimaryButton>
                    </div>
                }
            />
        </section>
    );
}
