import React, { useState, Fragment } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Listbox, Transition, Menu } from "@headlessui/react";
import {
    FaSearch,
    FaChevronDown,
    FaFilePdf,
    FaFileExcel,
    FaTags,
    FaList,
} from "react-icons/fa";
import {
    FiEdit2,
    FiTrash2,
    FiEye,
    FiRefreshCw,
    FiTag,
    FiCalendar,
    FiPlus,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";

export default function CategoryPage() {
    const { categoryData: categories, filters } = usePage().props;
    const { t } = useTranslation();

    // Delete state
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const {
        delete: destroy,
        data,
        setData,
        processing,
        reset,
    } = useForm({ id: "" });

    // Rows-per-page
    const pageSizes = [10, 25, 50, 100];
    const [pageSize, setPageSize] = useState(categories.per_page);

    function confirmDelete(category) {
        setToDelete(category);
        setData("id", category.id);
        setConfirmingDelete(true);
    }

    function closeModal() {
        setConfirmingDelete(false);
        reset();
        setToDelete(null);
    }

    function deleteRow(e) {
        e.preventDefault();
        destroy(route("categories.destroy", { id: data.id }), {
            preserveScroll: true,
            onSuccess: closeModal,
        });
    }

    function onPageSizeChange(size) {
        setPageSize(size);
        window.location = route("categories.index", {
            ...filters,
            per_page: size,
        });
    }

    // Breadcrumb & header
    const headWeb = t("categories.title");
    const crumbs = [
        { title: "Home", url: route("dashboard") },
        { title: headWeb, url: "" },
    ];

    return (
        <AdminLayout
            breadcrumb={<Breadcrumb header={headWeb} links={crumbs} />}
        >
            <Head title={headWeb} />

            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Search and Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center max-w-md w-full space-x-2">
                            <form
                                method="get"
                                action={route("categories.index")}
                                className="flex items-center w-full space-x-2"
                            >
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaSearch className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="search"
                                        defaultValue={filters?.search || ""}
                                        placeholder={t(
                                            "categories.searchPlaceholder"
                                        )}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 duration-200 transition hover:bg-green-600"
                                >
                                    <FaSearch className="w-4 h-4" />
                                    <span>{t("common.search")}</span>
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
                                <FaTags className="text-blue-500" />
                                {headWeb}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {t("categories.manageAndTrack")}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-3 rounded-lg shadow-sm shadow-blue-600">
                                <div className="flex items-center gap-2">
                                    <FiTag className="text-white w-5 h-5" />
                                    <span className="text-md font-medium text-white">
                                       {t("categories.totalCategories")} {categories.total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-blue-500">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiTag className="w-4 h-4" />
                                            {t("categories.table.id")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaTags className="w-4 h-4" />
                                            {t("categories.table.title")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                         {t("categories.table.actions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {categories.data.length > 0 ? (
                                    categories.data.map((category, idx) => (
                                        <tr
                                            key={category.id}
                                            className="hover:bg-gray-100 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {(categories.current_page -
                                                        1) *
                                                        categories.per_page +
                                                        idx +
                                                        1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {category.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route(
                                                            "categories.edit",
                                                            { id: category.id }
                                                        )}
                                                        className="flex items-center gap-2 text-white bg-blue-600 p-2 rounded-2xl transition-all duration-300 hover:bg-blue-700"
                                                        title="Edit Category"
                                                    >
                                                        <FiEdit2 className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                             {t("categories.actions.edit")}
                                                        </span>
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            confirmDelete(
                                                                category
                                                            )
                                                        }
                                                        disabled={
                                                            processing &&
                                                            data.id ===
                                                                category.id
                                                        }
                                                        className={`flex items-center gap-2 text-white bg-red-600 p-2 rounded-2xl transition-all duration-300 hover:bg-red-700 ${
                                                            processing &&
                                                            data.id ===
                                                                category.id
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : ""
                                                        }`}
                                                        title="Delete Category"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            {t("categories.actions.delete")}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            {t("categories.noCategoriesFound")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                             {t("categories.totalRows")}{" "}
                            <span className="font-medium">
                                {categories.total}
                            </span>{" "}
                             {t("categories.rows")}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span>{t("categories.rowsPerPage")}</span>
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
                            {categories.current_page && (
                                <>
                                    <div>
                                        {t("categories.pageOf")} {categories.current_page} {t("categories.Of")} {" "}
                                        {categories.last_page}
                                    </div>
                                    <div className="flex space-x-1">
                                        <Link
                                            href={
                                                categories.prev_page_url || "#"
                                            }
                                            className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                                !categories.prev_page_url
                                                    ? "opacity-50 pointer-events-none"
                                                    : ""
                                            }`}
                                        >
                                            «
                                        </Link>
                                        <Link
                                            href={
                                                categories.next_page_url || "#"
                                            }
                                            className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                                !categories.next_page_url
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
                        Are you sure you want to delete category{" "}
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
                            {processing ? "Deleting..." : "Delete Category"}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
