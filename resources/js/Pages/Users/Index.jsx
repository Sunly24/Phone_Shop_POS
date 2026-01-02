import Breadcrumb from "@/Components/Breadcrumb";
import DangerButton from "@/Components/DangerButton";
import ExportDropdown from "@/Components/ExportDropdown";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import Toast from "@/Components/Toast";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import { useState, useEffect, Fragment } from "react";
import { Listbox, Transition, Menu } from "@headlessui/react";
import {
    FaSearch,
    FaChevronDown,
    FaFilePdf,
    FaFileExcel,
    FaUsers,
    FaUserTag,
} from "react-icons/fa";
import {
    FiEdit2,
    FiTrash2,
    FiDownload,
    FiUpload,
    FiUser,
    FiUsers,
    FiMail,
    FiCalendar,
    FiRefreshCw,
    FiKey,
    FiUserX,
    FiUserCheck,
    FiShield,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";

export default function UserPage({ users }) {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const can = auth?.can ?? {};
    const [showImportModal, setShowImportModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Toast notification state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");

    // Get search value from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const [search, setSearch] = useState(urlParams.get("search") || "");

    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        clearErrors,
    } = useForm({
        id: "",
        excel_file: null,
    });

    // Password reset form
    const {
        data: passwordData,
        setData: setPasswordData,
        patch: patchPassword,
        errors: passwordErrors,
        reset: resetPassword,
        processing: passwordProcessing,
        recentlySuccessful: passwordRecentlySuccessful,
    } = useForm({
        password: "",
    });

    // Rows-per-page
    const pageSizes = [10, 25, 50, 100];
    const [pageSize, setPageSize] = useState(users.per_page);

    function onPageSizeChange(size) {
        setPageSize(size);
        window.location = route("users.index", {
            ...{ search },
            per_page: size,
        });
    }

    const handleExport = (e) => {
        e.preventDefault();
        window.location.href = route("users.export");
    };

    const confirmDelete = (user) => {
        setToDelete(user);
        setData("id", user.id);
        setConfirmingDelete(true);
    };

    const closeModal = () => {
        setConfirmingDelete(false);
        setToDelete(null);
        clearErrors();
        reset();
    };

    const deleteRow = (e) => {
        e.preventDefault();
        destroy(route("users.destroy", { id: data.id }), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onFinish: () => reset(),
        });
    };

    const openResetPasswordModal = (user) => {
        setSelectedUser(user);
        setShowPasswordModal(true);
        resetPassword();
    };

    const closePasswordModal = () => {
        setShowPasswordModal(false);
        setSelectedUser(null);
        resetPassword();
    };

    const handlePasswordReset = (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        patchPassword(route("users.reset-password", selectedUser.id), {
            onSuccess: () => {
                resetPassword();
                closePasswordModal();
                // Show success toast
                setToastMessage(
                    `Password reset successfully for ${selectedUser.name}!`
                );
                setToastType("success");
                setShowToast(true);
            },
            onError: () => {
                // Show error toast
                setToastMessage(
                    `Failed to reset password for ${selectedUser.name}. Please try again.`
                );
                setToastType("error");
                setShowToast(true);
            },
        });
    };

    const closeToast = () => {
        setShowToast(false);
    };

    const toggleUserStatus = (user) => {
        const action = user.is_active ? "block" : "unblock";
        const actionText = user.is_active ? "blocked" : "unblocked";

        router.patch(
            route("users.toggle-status", user.id),
            {},
            {
                onSuccess: () => {
                    setToastMessage(
                        `User ${user.name} has been ${actionText} successfully!`
                    );
                    setToastType("success");
                    setShowToast(true);
                },
                onError: (errors) => {
                    const errorMessage =
                        errors.error ||
                        `Failed to ${action} user. Please try again.`;
                    setToastMessage(errorMessage);
                    setToastType("error");
                    setShowToast(true);
                },
            }
        );
    };

    const handleFileChange = (e) => {
        setData("excel_file", e.target.files[0]);
    };

    const handleImport = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("excel_file", data.excel_file);

        router.post(route("users.import"), formData, {
            onSuccess: () => {
                setShowImportModal(false);
                setData("excel_file", null);
            },
            onError: () => {
                // Handle error silently
            },
            onFinish: () => {
                // Reset form state
            },
        });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add("border-primary");
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-primary");
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("border-primary");
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (
                file.type === "text/csv" ||
                file.type === "application/vnd.ms-excel" ||
                file.type ===
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ) {
                setData("excel_file", file);
            }
        }
    };

    // Function to get user initials for fallback avatar
    const getUserInitials = (name) => {
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Function to generate avatar background color based on name
    const getAvatarColor = (name) => {
        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-yellow-500",
            "bg-red-500",
            "bg-purple-500",
            "bg-pink-500",
            "bg-indigo-500",
            "bg-gray-500",
        ];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    const headWeb = t("users.title");
    const linksBreadcrumb = [
        { title: "Home", url: "/" },
        { title: headWeb, url: "" },
    ];

    return (
        <AdminLayout
            breadcrumb={<Breadcrumb header={headWeb} links={linksBreadcrumb} />}
        >
            <Head title={headWeb} />

            {/* Toast Notification */}
            <Toast
                message={toastMessage}
                type={toastType}
                show={showToast}
                onClose={closeToast}
                duration={5000}
            />

            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Search and Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center max-w-md w-full space-x-2">
                            <form
                                method="get"
                                action={route("users.index")}
                                className="flex items-center w-full space-x-2"
                            >
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaSearch className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="search"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder={t(
                                            "users.searchPlaceholder"
                                        )}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 duration-200 transition hover:bg-green-600 whitespace-nowrap"
                                >
                                    <FaSearch className="w-4 h-4" />
                                    <span>{t("common.search")}</span>
                                </button>
                            </form>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Import Button */}
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition duration-200 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                            >
                                <FiUpload className="w-4 h-4 mr-2" />
                                {t("users.import")}
                            </button>

                            {/* Export Dropdown */}
                            <ExportDropdown
                                exportUrl={route("users.export")}
                                currentFilters={{ search }}
                                buttonText="Export Users"
                            />
                        </div>
                    </div>
                </div>

                {/* Header with Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaUsers className="text-blue-500" />
                                {headWeb}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage and track all system users
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-3 rounded-lg shadow-sm shadow-blue-600">
                                <div className="flex items-center gap-2">
                                    <FiUsers className="text-white w-5 h-5" />
                                    <span className="text-md font-medium text-white">
                                        Total Users {users.total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-blue-500">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiUser className="w-4 h-4" />
                                            Profile
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiUser className="w-4 h-4" />
                                            Name
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiMail className="w-4 h-4" />
                                            Email
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaUserTag className="w-4 h-4" />
                                            Role
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiShield className="w-4 h-4" />
                                            Status
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiCalendar className="w-4 h-4" />
                                            Created At
                                        </div>
                                    </th>
                                    {(can["user-edit"] ||
                                        can["user-delete"]) && (
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                        >
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {users.data.length > 0 ? (
                                    users.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-gray-100 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {user.google_avatar ? (
                                                        <img
                                                            src={
                                                                user.google_avatar
                                                            }
                                                            alt={`${user.name}'s profile`}
                                                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                            onError={(e) => {
                                                                e.target.style.display =
                                                                    "none";
                                                                e.target.parentNode.querySelector(
                                                                    ".fallback-avatar"
                                                                ).style.display =
                                                                    "flex";
                                                            }}
                                                        />
                                                    ) : user.profile_photo_path ? (
                                                        <img
                                                            src={`/storage/${user.profile_photo_path}`}
                                                            alt={`${user.name}'s profile`}
                                                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                                            onError={(e) => {
                                                                e.target.style.display =
                                                                    "none";
                                                                e.target.parentNode.querySelector(
                                                                    ".fallback-avatar"
                                                                ).style.display =
                                                                    "flex";
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div
                                                        className={`fallback-avatar w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAvatarColor(
                                                            user.name
                                                        )} ${
                                                            user.google_avatar ||
                                                            user.profile_photo_path
                                                                ? "hidden"
                                                                : "flex"
                                                        }`}
                                                    >
                                                        {getUserInitials(
                                                            user.name
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {user.roles[0]?.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        user.is_active
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {user.is_active
                                                        ? "Active"
                                                        : "Blocked"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {new Date(
                                                        user.created_at
                                                    ).toLocaleDateString()}
                                                </div>
                                            </td>
                                            {(can["user-edit"] ||
                                                can["user-delete"]) && (
                                                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {can["user-edit"] && (
                                                            <Link
                                                                href={route(
                                                                    "users.edit",
                                                                    user.id
                                                                )}
                                                                className="flex items-center gap-2 text-white bg-blue-600 p-2 rounded-2xl transition-all duration-300 hover:bg-blue-700"
                                                                title="Edit User"
                                                            >
                                                                <FiEdit2 className="h-4 w-4" />
                                                                <span className="text-sm font-medium">
                                                                    Edit
                                                                </span>
                                                            </Link>
                                                        )}
                                                        {can["user-edit"] && (
                                                            <button
                                                                onClick={() =>
                                                                    openResetPasswordModal(
                                                                        user
                                                                    )
                                                                }
                                                                className="flex items-center gap-2 text-white bg-yellow-600 p-2 rounded-2xl transition-all duration-300 hover:bg-yellow-700"
                                                                title="Reset Password"
                                                            >
                                                                <FiKey className="h-4 w-4" />
                                                                <span className="text-sm font-medium">
                                                                    Reset
                                                                </span>
                                                            </button>
                                                        )}
                                                        {can["user-edit"] && (
                                                            <button
                                                                onClick={() =>
                                                                    toggleUserStatus(
                                                                        user
                                                                    )
                                                                }
                                                                className={`flex items-center gap-2 text-white p-2 rounded-2xl transition-all duration-300 ${
                                                                    user.is_active
                                                                        ? "bg-red-600 hover:bg-red-700"
                                                                        : "bg-green-600 hover:bg-green-700"
                                                                }`}
                                                                title={
                                                                    user.is_active
                                                                        ? "Block User"
                                                                        : "Unblock User"
                                                                }
                                                            >
                                                                {user.is_active ? (
                                                                    <>
                                                                        <FiUserX className="h-4 w-4" />
                                                                        <span className="text-sm font-medium">
                                                                            Block
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FiUserCheck className="h-4 w-4" />
                                                                        <span className="text-sm font-medium">
                                                                            Unblock
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No users found. Try adjusting your
                                            search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Total{" "}
                            <span className="font-medium">{users.total}</span>{" "}
                            rows
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span>Rows per page:</span>
                                <Listbox
                                    value={pageSize}
                                    onChange={onPageSizeChange}
                                >
                                    <div className="relative">
                                        <Listbox.Button className="w-24 px-3 py-2 border rounded-lg flex justify-between items-center focus:outline-none">
                                            <span>{pageSize}</span>
                                            <FaChevronDown className="w-4 h-4 text-gray-500" />
                                        </Listbox.Button>
                                        <Transition
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="absolute z-10 w-full bg-white border rounded-lg shadow max-h-60 overflow-auto">
                                                {pageSizes.map((size) => (
                                                    <Listbox.Option
                                                        key={size}
                                                        value={size}
                                                        className={({
                                                            active,
                                                            selected,
                                                        }) =>
                                                            `cursor-pointer select-none px-4 py-2 ${
                                                                active
                                                                    ? "bg-blue-100"
                                                                    : ""
                                                            } ${
                                                                selected
                                                                    ? "font-semibold"
                                                                    : "font-normal"
                                                            }`
                                                        }
                                                    >
                                                        {size}
                                                    </Listbox.Option>
                                                ))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </Listbox>
                            </div>
                            <div>
                                Page {users.current_page} of {users.last_page}
                            </div>
                            <div className="flex space-x-1">
                                <Link
                                    href={users.prev_page_url || "#"}
                                    className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                        !users.prev_page_url
                                            ? "opacity-50 pointer-events-none"
                                            : ""
                                    }`}
                                >
                                    «
                                </Link>
                                <Link
                                    href={users.next_page_url || "#"}
                                    className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                        !users.next_page_url
                                            ? "opacity-50 pointer-events-none"
                                            : ""
                                    }`}
                                >
                                    »
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            <Modal
                show={showImportModal}
                onClose={() => setShowImportModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        Import Users
                    </h2>
                    <div className="text-center">
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4 transition-colors duration-200 ease-in-out hover:border-blue-500"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <div className="flex justify-center mb-4">
                                <img
                                    src="/images/file-types.png"
                                    alt="File Types"
                                    className="w-24 h-auto"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = "none";
                                    }}
                                />
                            </div>
                            <p className="text-gray-700 mb-3">
                                Drag Excel file here to import user information
                            </p>
                            <p className="text-sm text-gray-500 mb-3">
                                or click to browse, up to (5 MB max)
                            </p>
                            <div className="flex justify-center">
                                <input
                                    type="file"
                                    name="excel_file"
                                    id="excel_file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    onClick={() =>
                                        document
                                            .getElementById("excel_file")
                                            .click()
                                    }
                                    className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-full shadow-sm
                                    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                    transition duration-150"
                                    type="button"
                                >
                                    <FiUpload className="w-4 h-4" />
                                    Browse File
                                </button>
                            </div>
                            {data.excel_file && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Selected: {data.excel_file.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowImportModal(false);
                                setData("excel_file", null);
                            }}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-full shadow-sm
                            hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1
                            transition duration-150"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!data.excel_file || processing}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-full shadow-sm
                            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                            transition duration-150 disabled:opacity-50"
                        >
                            {processing ? "Importing..." : "Import"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={confirmingDelete} onClose={closeModal}>
                <form onSubmit={deleteRow} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Confirm Deletion
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete user{" "}
                        <strong>{toDelete?.name}</strong>? This action cannot be
                        undone.
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <DangerButton type="submit" disabled={processing}>
                            {processing ? "Deleting..." : "Delete User"}
                        </DangerButton>
                    </div>
                </form>
            </Modal>

            {/* Password Reset Modal */}
            <Modal
                show={showPasswordModal}
                onClose={closePasswordModal}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <FiKey className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Reset Password
                            </h3>
                            <p className="text-sm text-gray-500">
                                Set a new password for{" "}
                                <strong>{selectedUser?.name}</strong>
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordReset} className="space-y-6">
                        {/* Password errors */}
                        {Object.keys(passwordErrors).length > 0 && (
                            <div className="p-3 bg-red-100 text-red-800 rounded-lg">
                                <p className="font-bold">
                                    Please fix the following errors:
                                </p>
                                <ul className="list-disc pl-5">
                                    {Object.entries(passwordErrors).map(
                                        ([field, message]) => (
                                            <li key={field}>
                                                {field}: {message}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* New Password */}
                        <div>
                            <label
                                htmlFor="modal_password"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                New Password{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="modal_password"
                                name="password"
                                type="password"
                                value={passwordData.password}
                                onChange={(e) =>
                                    setPasswordData("password", e.target.value)
                                }
                                className={`block w-full rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400
                                    focus:border-yellow-500 focus:ring-4 focus:ring-yellow-200 
                                    ${
                                        passwordErrors.password
                                            ? "border-red-500 focus:ring-red-200"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm`}
                                placeholder="Enter new password"
                                autoFocus
                            />
                        </div>

                        {/* Success message */}
                        <Transition
                            show={passwordRecentlySuccessful}
                            enter="transition-opacity duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity duration-150"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700">
                                <svg
                                    className="-ml-1 mr-2 h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Password reset successfully
                            </div>
                        </Transition>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={closePasswordModal}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={passwordProcessing}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {passwordProcessing ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Resetting...
                                    </>
                                ) : (
                                    <>
                                        <FiKey className="w-4 h-4 mr-2" />
                                        Reset Password
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Toast Notification */}
            <Toast
                show={showToast}
                message={toastMessage}
                type={toastType}
                onClose={closeToast}
            />
        </AdminLayout>
    );
}
