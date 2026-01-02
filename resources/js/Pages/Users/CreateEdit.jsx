import { Head, Link, useForm } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import Breadcrumb from "@/Components/Breadcrumb";
import InputError from "@/Components/InputError";
import AdminLayout from "@/Layouts/AdminLayout";
import { FiSave, FiX, FiPlusCircle, FiEdit2, FiUser } from "react-icons/fi";

export default function UsersCreateEdit({ user = {}, roles = [] }) {
    const isEdit = Boolean(user && user.id);

    const {
        data,
        setData,
        post,
        patch,
        errors,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        name: user?.name || "",
        email: user?.email || "",
        password: isEdit ? "" : "",
        password_confirmation: isEdit ? "" : "",
        roles: user?.roles?.map((role) => role.name) || [],
    });

    const submit = (e) => {
        e.preventDefault();
        if (!user?.id) {
            post(route("users.store"), {
                preserveState: true,
                onSuccess: () => {
                    reset();
                },
                onError: (errors) => {
                    // Handle errors if needed
                },
            });
        } else {
            // For edit, we don't include password fields
            const updateData = {
                name: data.name,
                email: data.email,
                roles: data.roles,
            };

            patch(route("users.update", user.id), {
                data: updateData,
                onFinish: () => {
                    reset();
                },
            });
        }
    };

    const title = isEdit ? "Edit User" : "Create User";
    const crumbs = [
        { title: "Home", url: route("dashboard") },
        { title: "Users", url: route("users.index") },
        { title, url: "" },
    ];

    return (
        <AdminLayout breadcrumb={<Breadcrumb header={title} links={crumbs} />}>
            <Head title={title} />

            <div className="w-full h-screen bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-200 flex flex-col">
                {/* Top border accent with gradient */}
                <div
                    className={`h-2 ${
                        isEdit
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : "bg-gradient-to-r from-blue-500 to-blue-700"
                    }`}
                />

                {/* Header section */}
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex items-center space-x-4">
                    <div
                        className={`p-3 rounded-full ${
                            isEdit
                                ? "bg-yellow-100 dark:bg-yellow-900/20"
                                : "bg-blue-100 dark:bg-blue-900/20"
                        } transform hover:scale-110 transition-all duration-200`}
                    >
                        {isEdit ? (
                            <FiEdit2 className="w-7 h-7 text-yellow-500 dark:text-yellow-400" />
                        ) : (
                            <FiPlusCircle className="w-7 h-7 text-blue-500 dark:text-blue-400" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isEdit
                                ? "Update existing user details below"
                                : "Add a new user to the system"}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="flex-1 overflow-y-auto px-8 py-8 space-y-8"
                >
                    {/* Error messages */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-xl shadow-sm">
                            <p className="font-bold">
                                Please fix the following errors:
                            </p>
                            <ul className="list-disc pl-5">
                                {Object.entries(errors).map(
                                    ([field, message]) => (
                                        <li key={field}>
                                            {field}: {message}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name Field */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.name
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                placeholder="Enter user name"
                                autoFocus
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData("email", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.email
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                placeholder="Enter email address"
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    {/* Password Fields - Only show when creating new user */}
                    {!isEdit && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Password Field */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Password{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData("password", e.target.value)
                                    }
                                    className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                        focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                        ${
                                            errors.password
                                                ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                                : ""
                                        }
                                        transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                    placeholder="Enter password"
                                />
                                <InputError
                                    message={errors.password}
                                    className="mt-2 text-sm text-red-500 dark:text-red-400"
                                />
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                                >
                                    Confirm Password{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            "password_confirmation",
                                            e.target.value
                                        )
                                    }
                                    className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                        focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                        ${
                                            errors.password_confirmation
                                                ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                                : ""
                                        }
                                        transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                    placeholder="Confirm password"
                                />
                                <InputError
                                    message={errors.password_confirmation}
                                    className="mt-2 text-sm text-red-500 dark:text-red-400"
                                />
                            </div>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="roles"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="roles"
                                name="roles"
                                value={data.roles[0] || ""}
                                onChange={(e) =>
                                    setData("roles", [e.target.value])
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.roles
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                            >
                                <option value="">Select Role</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.name}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.roles}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-800">
                        <Transition
                            show={recentlySuccessful}
                            enter="transition-opacity duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity duration-150"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-md">
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
                                {isEdit
                                    ? "User updated successfully"
                                    : "User created successfully"}
                            </div>
                        </Transition>
                        <div className="flex space-x-4">
                            <Link
                                href={route("users.index")}
                                className="inline-flex items-center gap-2 px-5 py-3 border border-gray-300 dark:border-gray-600 shadow-md text-sm font-semibold rounded-xl 
                                    bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900
                                    transition-all duration-200 ease-in-out transform hover:-translate-y-0.5"
                            >
                                <FiX className="w-5 h-5" />
                                <span>Cancel</span>
                            </Link>

                            <button
                                type="submit"
                                disabled={processing}
                                className={`inline-flex items-center gap-2 px-5 py-3 border border-transparent shadow-md text-sm font-semibold rounded-xl 
                                    focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:-translate-y-0.5
                                    ${
                                        isEdit
                                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:ring-yellow-400 text-white"
                                            : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:ring-blue-400 text-white"
                                    }
                                    disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                {processing ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                                        {isEdit ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-5 h-5" />
                                        <span>
                                            {isEdit
                                                ? "Update User"
                                                : "Create User"}
                                        </span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
