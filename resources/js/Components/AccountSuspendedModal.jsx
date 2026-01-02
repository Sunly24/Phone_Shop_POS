import { FiShield, FiMail, FiPhone, FiX } from "react-icons/fi";
import Modal from "./Modal";

export default function AccountSuspendedModal({
    show = false,
    onClose = () => {},
    reason = null,
}) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <FiShield className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Account Suspended
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="text-md font-semibold text-red-800 mb-2">
                            Access Restricted
                        </h4>
                        <p className="text-red-700 text-sm">
                            Your account access has been suspended. You cannot
                            login or access the system at this time.
                        </p>
                        {reason && (
                            <p className="text-red-600 text-sm mt-2 font-medium">
                                Reason: {reason}
                            </p>
                        )}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            <FiMail className="h-4 w-4" />
                            Need Help?
                        </h4>
                        <div className="space-y-2 text-sm text-blue-700">
                            <p>
                                Please contact your administrator to resolve
                                this issue:
                            </p>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <FiMail className="h-3 w-3" />
                                    <span>Email: admin@phoneshop.com</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FiPhone className="h-3 w-3" />
                                    <span>Phone: +1 (555) 123-4567</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Close
                    </button>
                </div>

                <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                        This suspension is temporary and can be reversed by your
                        administrator.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
