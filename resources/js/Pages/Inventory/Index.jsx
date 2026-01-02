import React, { useState, useRef, useEffect, Fragment } from "react";
import { usePage, Link } from "@inertiajs/react";
import { Listbox, Transition, Menu } from "@headlessui/react";
import {
    FaSearch,
    FaChevronDown,
    FaBox,
    FaBoxes,
    FaFilePdf,
    FaFileExcel,
} from "react-icons/fa";
import {
    FiTrash2,
    FiPackage,
    FiDollarSign,
    FiShoppingBag,
    FiRefreshCw,
    FiUpload,
} from "react-icons/fi";
import { HiChevronDown } from "react-icons/hi";
import { CiExport, CiImport } from "react-icons/ci";
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";

export default function InventoryIndex() {
    const {
        products = {
            data: [],
            current_page: 1,
            per_page: 10,
            last_page: 1,
            total: 0,
            prev_page_url: null,
            next_page_url: null,
        },
        filters = {},
    } = usePage().props;

    const [search, setSearch] = useState(filters.search || "");
    const [pageSize, setPageSize] = useState(products.per_page || 10);

    const fileInputRef = useRef();

    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [toDelete, setToDelete] = useState(null);

    // Export info state
    const [exportInfo, setExportInfo] = useState(null);
    const [loadingExportInfo, setLoadingExportInfo] = useState(true);

    // Fetch export info every 10 seconds to auto-update
    useEffect(() => {
        const fetchExportInfo = () => {
            fetch("/inventories/inventory/export-info")
                .then((res) => res.json())
                .then((data) => {
                    setExportInfo(data);
                    setLoadingExportInfo(false);
                })
                .catch(() => setLoadingExportInfo(false));
        };
        fetchExportInfo();
        const interval = setInterval(fetchExportInfo, 10000);
        return () => clearInterval(interval);
    }, []);

    const headWeb = "Inventory List";
    const crumbs = [
        { title: "Home", url: route("dashboard") },
        { title: headWeb, url: "" },
    ];

    function onPageSizeChange(size) {
        setPageSize(size);
        window.location = route("inventory.index", {
            ...filters,
            per_page: size,
        });
    }

    function handleExport(format) {
        window.location.href = route("inventory.export", format);
    }

    function handleFileChange(e) {
        if (e.target.files.length > 0) {
            e.target.form.submit();
        }
    }

    function confirmDelete(product) {
        setToDelete(product);
        setConfirmingDelete(true);
    }

    function closeModal() {
        setConfirmingDelete(false);
        setToDelete(null);
    }

    function deleteRow(e) {
        e.preventDefault();
        closeModal();
    }

    return (
        <AdminLayout
            breadcrumb={<Breadcrumb header={headWeb} links={crumbs} />}
        >
            {/* Export status box */}
            <div className="mb-4">
                {loadingExportInfo ? (
                    <div className="p-4 bg-gray-50 border rounded mb-2">
                        Loading export info...
                    </div>
                ) : exportInfo && exportInfo.last_export ? (
                    <div className="p-4 bg-green-50 border rounded mb-2">
                        <div>
                            <strong>Last Export:</strong>{" "}
                            {exportInfo.last_export}
                        </div>
                        <div>
                            <strong>Status:</strong> {exportInfo.status}
                        </div>
                        <div>
                            <strong>Message:</strong> {exportInfo.message}
                        </div>
                        <div className="flex gap-4 mt-2">
                            {exportInfo.pdf && (
                                <a
                                    href={`/storage/${exportInfo.pdf}`}
                                    className="text-blue-600 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open PDF
                                </a>
                            )}
                            {exportInfo.excel && (
                                <a
                                    href={`/storage/${exportInfo.excel}`}
                                    className="text-green-600 underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Open Excel
                                </a>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-yellow-50 border rounded mb-2">
                        No export has been generated yet.
                    </div>
                )}
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Search and Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Search Form */}
                        <form
                            method="get"
                            action={route("inventory.index")}
                            className="flex items-center max-w-md w-full space-x-2"
                        >
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    name="search"
                                    defaultValue={filters.search || ""}
                                    placeholder="Search Product ID or Title"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 duration-200 transition hover:bg-green-600"
                            >
                                <FaSearch className="w-4 h-4" />
                                <span>Filter</span>
                            </button>
                        </form>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Import Button */}
                            <form
                                method="POST"
                                action={route("inventory.import")}
                                encType="multipart/form-data"
                                className="flex items-center"
                            >
                                <input
                                    type="hidden"
                                    name="_token"
                                    value={window.Laravel?.csrfToken}
                                />
                                <input
                                    type="file"
                                    name="import_file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition duration-200 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                                >
                                    <FiUpload className="w-4 h-4 mr-2" />
                                    Import Products
                                </button>
                            </form>

                            {/* Export Dropdown */}
                            <Menu as="div" className="relative">
                                <Menu.Button className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition duration-200 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    <span className="flex items-center">
                                        <CiExport className="w-4 h-4 mr-2" />
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
                                                    <button
                                                        onClick={() =>
                                                            handleExport("pdf")
                                                        }
                                                        className={`flex items-center px-4 py-3 text-sm transition duration-200 ${
                                                            active
                                                                ? "bg-gray-100"
                                                                : ""
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
                                                    </button>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() =>
                                                            handleExport(
                                                                "excel"
                                                            )
                                                        }
                                                        className={`flex items-center px-4 py-3 text-sm transition duration-200 ${
                                                            active
                                                                ? "bg-gray-100"
                                                                : ""
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
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    </div>
                </div>

                {/* Header with Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaBoxes className="text-blue-500" />
                                {headWeb}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Manage and track product inventory
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-3 rounded-lg shadow-sm shadow-blue-600">
                                <div className="flex items-center gap-2">
                                    <FiPackage className="text-white w-5 h-5" />
                                    <span className="text-md font-medium text-white">
                                        Total Products {products.total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Table */}
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
                                            <FiPackage className="w-4 h-4" />
                                            ID
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiShoppingBag className="w-4 h-4" />
                                            Product
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiDollarSign className="w-4 h-4" />
                                            Price
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaBox className="w-4 h-4" />
                                            Stock
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaBoxes className="w-4 h-4" />
                                            Booked
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        Last Update
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
                                {products.data.length > 0 ? (
                                    products.data.map((product, idx) => (
                                        <tr
                                            key={product.product_id}
                                            className="hover:bg-gray-100 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm">
                                                {(products.current_page - 1) *
                                                    products.per_page +
                                                    idx +
                                                    1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold">
                                                {product.product_title}
                                                <div className="text-xs text-gray-500">
                                                    {product.color
                                                        ?.color_title && (
                                                        <span>
                                                            Color:{" "}
                                                            {
                                                                product.color
                                                                    .color_title
                                                            }
                                                        </span>
                                                    )}
                                                    {product.product_ram && (
                                                        <span className="ml-2">
                                                            RAM:{" "}
                                                            {
                                                                product.product_ram
                                                            }{" "}
                                                            GB
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {product.product_price
                                                    ? `$${product.product_price}`
                                                    : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {product.product_stock ?? "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {product.quantity_booked ?? 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {product.inventory?.updated_at
                                                    ? new Date(
                                                          product.inventory.updated_at
                                                      ).toLocaleString()
                                                    : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <button
                                                    onClick={() =>
                                                        confirmDelete(product)
                                                    }
                                                    className="flex items-center gap-2 text-white bg-red-600 p-2 rounded-2xl transition-all duration-300 hover:bg-red-700 hover:text-red-800"
                                                >
                                                    <FiTrash2 className="h-5 w-5" />
                                                    <span className="text-sm font-medium">
                                                        Delete
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-4 text-center text-sm text-gray-500"
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer: total, rows-per-page, pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-700">
                            Total{" "}
                            <span className="font-medium">
                                {products.total}
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
                                                {[10, 25, 50, 100].map(
                                                    (size) => (
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
                                                    )
                                                )}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                </Listbox>
                            </div>
                            <div>
                                Page {products.current_page} of{" "}
                                {products.last_page}
                            </div>
                            <div className="flex space-x-1">
                                <Link
                                    href={products.prev_page_url || "#"}
                                    className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                        !products.prev_page_url
                                            ? "opacity-50 pointer-events-none"
                                            : ""
                                    }`}
                                >
                                    «
                                </Link>
                                <Link
                                    href={products.next_page_url || "#"}
                                    className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                        !products.next_page_url
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

            {/* Delete confirmation modal */}
            <Modal show={confirmingDelete} onClose={closeModal}>
                <form className="p-6" onSubmit={deleteRow}>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Confirm Deletion
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete inventory for{" "}
                        <strong>{toDelete?.product_title}</strong>?
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Cancel
                        </button>
                        <DangerButton type="submit">Yes, Delete</DangerButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
