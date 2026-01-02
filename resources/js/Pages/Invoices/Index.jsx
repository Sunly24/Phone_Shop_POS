import React, { useState, Fragment } from "react";
import { Head, Link, usePage, useForm } from "@inertiajs/react";
import { Listbox, Transition, Menu } from "@headlessui/react";
import {
    FaChevronDown,
    FaSearch,
    FaFilePdf,
    FaFileExcel,
    FaFileInvoiceDollar,
    FaDollarSign,
    FaMoneyBillWave,
} from "react-icons/fa";
import {
    FiTrash2,
    FiEye,
    FiRefreshCw,
    FiUser,
    FiCalendar,
    FiActivity,
    FiList,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";

export default function InvoiceIndex() {
    const {
        invoices = {
            data: [],
            current_page: 1,
            per_page: 10,
            last_page: 1,
            total: 0,
        },
        filters = {},
    } = usePage().props;
    const { t } = useTranslation();

    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [toDelete, setToDelete] = useState(null);

    const { delete: destroy, processing } = useForm();

    const [pageSize, setPageSize] = useState(invoices.per_page);
    const pageSizes = [10, 25, 50, 100];

    function onPageSizeChange(size) {
        setPageSize(size);
        window.location = route("invoices.index", {
            ...filters,
            per_page: size,
        });
    }

    function confirmDelete(invoice) {
        setToDelete(invoice);
        setConfirmingDelete(true);
    }

    function closeModal() {
        setConfirmingDelete(false);
        setToDelete(null);
    }

    function deleteInvoice(e) {
        e.preventDefault();

        destroy(route("invoices.destroy", { id: toDelete.invoice_id }), {
            onSuccess: () => {
                closeModal();
            },
            onError: () => {
                alert("Failed to delete invoice.");
            },
        });
    }

    // Breadcrumb & header
    const headWeb = t("invoices.title");
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
                                action={route("invoices.index")}
                                className="flex items-center w-full space-x-2"
                            >
                                <div className="relative w-full">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaSearch className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="search"
                                        defaultValue={filters.search || ""}
                                        placeholder={t(
                                            "invoices.searchPlaceholder"
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

                        {/* <div className="flex items-center gap-3 flex-wrap">
                            {/* Export Dropdown 
                            <Menu as="div" className="relative">
                                <Menu.Button className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition duration-200 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    <span className="flex items-center">
                                        <FiRefreshCw className="w-4 h-4 mr-2" />
                                        Export
                                    </span>
                                </Menu.Button>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white hover:bg-gray-200 ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-gray-100 dark:border-gray-700">
                                        <div className="py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <a
                                                        href={route(
                                                            "invoices.export",
                                                            {
                                                                format: "pdf",
                                                                ...filters,
                                                            }
                                                        )}
                                                        target="_blank"
                                                        className={`flex items-center px-4 py-3 text-sm transition duration-200 ${
                                                            active
                                                                ? "bg-gray-100 text-gray-900 dark:text-white"
                                                                : "text-gray-700 dark:text-gray-200"
                                                        }`}
                                                    >
                                                        <FaFilePdf className="mr-3 h-5 w-5 text-red-500" />
                                                        <div>
                                                            <div className="font-medium">
                                                                PDF Export
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                Portable
                                                                Document Format
                                                            </div>
                                                        </div>
                                                    </a>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <a
                                                        href={route(
                                                            "invoices.export",
                                                            {
                                                                format: "excel",
                                                                ...filters,
                                                            }
                                                        )}
                                                        target="_blank"
                                                        className={`flex items-center px-4 py-3 text-sm transition duration-200 ${
                                                            active
                                                                ? "bg-gray-100 text-gray-900 dark:text-white"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        <FaFileExcel className="mr-3 h-5 w-5 text-green-600" />
                                                        <div>
                                                            <div className="font-medium">
                                                                Excel Export
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                Microsoft Excel
                                                                Spreadsheet
                                                            </div>
                                                        </div>
                                                    </a>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div> */}
                    </div>
                </div>

                {/* Header with Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaFileInvoiceDollar className="text-blue-500" />
                                {headWeb}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                               {t("invoices.manageAndTrack")}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-3 rounded-lg shadow-sm shadow-blue-600">
                                <div className="flex items-center gap-2">
                                    <FaMoneyBillWave className="text-white w-5 h-5" />
                                    <span className="text-md font-medium text-white">
                                        {t("invoices.totalInvoice")} {invoices.total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoices Table */}
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
                                            <FiList className="w-4 h-4" />
                                            {t("invoices.table.id")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiUser className="w-4 h-4" />
                                            {t("invoices.table.customer")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaDollarSign className="w-4 h-4" />
                                            {t("invoices.table.totalAmount")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiActivity className="w-4 h-4" />
                                            {t("invoices.table.status")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiCalendar className="w-4 h-4" />
                                            {t("invoices.table.createdAt")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        {t("invoices.table.actions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {invoices.data.length > 0 ? (
                                    invoices.data.map((invoice) => (
                                        <tr
                                            key={invoice.invoice_id}
                                            className="hover:bg-gray-100 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    #{invoice.invoice_id}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {invoice.customer?.name ||
                                                        "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {invoice.currency === "KHR"
                                                        ? `${Number(
                                                              invoice.total_amount
                                                          ).toLocaleString()} ៛`
                                                        : `$${Number(
                                                              invoice.total_amount
                                                          ).toFixed(2)}`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${
                                                        invoice.is_paid
                                                            ? "bg-green-500 text-white"
                                                            : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                                                    }`}
                                                >
                                                    {invoice.is_paid
                                                        ? "Paid"
                                                        : "Unpaid"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {new Date(
                                                        invoice.created_at
                                                    ).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route(
                                                            "invoiceOrders.show",
                                                            {
                                                                id: invoice.invoice_id,
                                                            }
                                                        )}
                                                        className="flex items-center gap-2 text-white bg-blue-600 p-2 rounded-2xl transition-all duration-300 hover:bg-blue-700"
                                                        title="View Invoice"
                                                    >
                                                        <FiEye className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            {t("invoices.actions.view")}
                                                        </span>
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            confirmDelete(
                                                                invoice
                                                            )
                                                        }
                                                        disabled={processing}
                                                        className={`flex items-center gap-2 text-white bg-red-600 p-2 rounded-2xl transition-all duration-300 hover:bg-red-700 ${
                                                            processing
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : ""
                                                        }`}
                                                        title="Delete Invoice"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            {t("invoices.actions.delete")}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No invoices found.
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
                                {invoices.total}
                            </span>{" "}
                            invoices
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
                            {invoices.current_page && (
                                <>
                                    <div>
                                        Page {invoices.current_page} of{" "}
                                        {invoices.last_page}
                                    </div>
                                    <div className="flex space-x-1">
                                        <Link
                                            href={invoices.prev_page_url || "#"}
                                            className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                                !invoices.prev_page_url
                                                    ? "opacity-50 pointer-events-none"
                                                    : ""
                                            }`}
                                        >
                                            «
                                        </Link>
                                        <Link
                                            href={invoices.next_page_url || "#"}
                                            className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                                !invoices.next_page_url
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

            {/* Delete confirmation modal */}
            <Modal show={confirmingDelete} onClose={closeModal}>
                <form className="p-6" onSubmit={deleteInvoice}>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Confirm Deletion
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete invoice{" "}
                        <strong>#{toDelete?.invoice_id}</strong>? This action
                        cannot be undone.
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
                            {processing ? "Deleting..." : "Delete Invoice"}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
