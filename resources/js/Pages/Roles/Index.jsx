import React, { useState, Fragment } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Listbox, Transition } from "@headlessui/react";
import Breadcrumb from "@/Components/Breadcrumb";
import DangerButton from "@/Components/DangerButton";
import Modal from "@/Components/Modal";
import AdminLayout from "@/Layouts/AdminLayout";
import { FaSearch, FaChevronDown, FaUserShield, FaLock } from "react-icons/fa";
import { FiEdit2, FiTrash2, FiEye, FiShield, FiCalendar } from "react-icons/fi";

export default function RolePage({ roles }) {
    const { auth } = usePage().props;
    const can = auth?.can ?? {};

    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const {
        data: deleteData,
        setData: setDeleteData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        id: "",
        name: "",
    });

    // Rows-per-page
    const pageSizes = [10, 25, 50, 100];
    const [pageSize, setPageSize] = useState(roles.per_page || 10);

    function onPageSizeChange(size) {
        setPageSize(size);
        window.location = route("roles.index", { per_page: size });
    }

    const confirmDelete = (role) => {
        setToDelete(role);
        setDeleteData("id", role.id);
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
        destroy(route("roles.destroy", { id: deleteData.id }), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onFinish: () => reset(),
        });
    };

    const headWeb = "Roles List";
    const linksBreadcrumb = [
        { title: "Home", url: "/" },
        { title: headWeb, url: "" },
    ];

    return (
        <AdminLayout
            breadcrumb={<Breadcrumb header={headWeb} links={linksBreadcrumb} />}
        >
            <Head title={headWeb} />

            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Search and Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center max-w-md w-full space-x-2">
                            <form
                                method="get"
                                action={route("roles.index")}
                                className="flex items-center w-full space-x-2"
                            >
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaSearch className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="search"
                                        defaultValue={""}
                                        placeholder="Search Role Name"
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 duration-200 transition hover:bg-green-600"
                                >
                                    <FaSearch className="w-4 h-4" />
                                    <span>Search</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Header with Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaUserShield className="text-blue-500" />
                                {headWeb}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage and track user roles and permissions
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-3 rounded-lg shadow-sm shadow-blue-600">
                                <div className="flex items-center gap-2">
                                    <FiShield className="text-white w-5 h-5" />
                                    <span className="text-md font-medium text-white">
                                        Total Roles{" "}
                                        {roles.total || roles.data.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Roles Table */}
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
                                            <FiShield className="w-4 h-4" />
                                            ID
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaUserShield className="w-4 h-4" />
                                            Name
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaLock className="w-4 h-4" />
                                            Guard
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
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {roles.data.length > 0 ? (
                                    roles.data.map((role) => (
                                        <tr
                                            key={role.id}
                                            className="hover:bg-gray-100 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {role.id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {role.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {role.guard_name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {new Date(
                                                        role.created_at
                                                    ).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={
                                                            route().has(
                                                                "roles.show"
                                                            )
                                                                ? route(
                                                                      "roles.show",
                                                                      role.id
                                                                  )
                                                                : route(
                                                                      "roles.edit",
                                                                      role.id
                                                                  )
                                                        }
                                                        className="flex items-center gap-2 text-white bg-gray-500 p-2 rounded-2xl transition-all duration-300 hover:bg-gray-600"
                                                        title="View Role"
                                                    >
                                                        <FiEye className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            {route().has(
                                                                "roles.show"
                                                            )
                                                                ? "Show"
                                                                : "View"}
                                                        </span>
                                                    </Link>
                                                    {can["role-edit"] && (
                                                        <Link
                                                            href={route(
                                                                "roles.edit",
                                                                role.id
                                                            )}
                                                            className="flex items-center gap-2 text-white bg-blue-600 p-2 rounded-2xl transition-all duration-300 hover:bg-blue-700"
                                                            title="Edit Role"
                                                        >
                                                            <FiEdit2 className="h-4 w-4" />
                                                            <span className="text-sm font-medium">
                                                                Edit
                                                            </span>
                                                        </Link>
                                                    )}
                                                    {can["role-delete"] && (
                                                        <button
                                                            onClick={() =>
                                                                confirmDelete(
                                                                    role
                                                                )
                                                            }
                                                            disabled={
                                                                processing &&
                                                                deleteData.id ===
                                                                    role.id
                                                            }
                                                            className={`flex items-center gap-2 text-white bg-red-600 p-2 rounded-2xl transition-all duration-300 hover:bg-red-700 ${
                                                                processing &&
                                                                deleteData.id ===
                                                                    role.id
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : ""
                                                            }`}
                                                            title="Delete Role"
                                                        >
                                                            <FiTrash2 className="h-4 w-4" />
                                                            <span className="text-sm font-medium">
                                                                Delete
                                                            </span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No roles found. Try adjusting your
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
                            <span className="font-medium">
                                {roles.total || roles.data.length}
                            </span>{" "}
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
                            {roles.current_page && (
                                <>
                                    <div>
                                        Page {roles.current_page} of{" "}
                                        {roles.last_page}
                                    </div>
                                    <div className="flex space-x-1">
                                        <Link
                                            href={roles.prev_page_url || "#"}
                                            className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                                !roles.prev_page_url
                                                    ? "opacity-50 pointer-events-none"
                                                    : ""
                                            }`}
                                        >
                                            «
                                        </Link>
                                        <Link
                                            href={roles.next_page_url || "#"}
                                            className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                                !roles.next_page_url
                                                    ? "opacity-50 pointer-events-none"
                                                    : ""
                                            }`}
                                        >
                                            »
                                        </Link>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal show={confirmingDelete} onClose={closeModal}>
                <form onSubmit={deleteRow} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Confirm Deletion
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete role{" "}
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
                            {processing ? "Deleting..." : "Delete Role"}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
