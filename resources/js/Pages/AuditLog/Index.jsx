import React, { useState, Fragment, useEffect } from "react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { Listbox, Transition, Menu } from "@headlessui/react";
import {
    FaSearch,
    FaChevronDown,
    FaFilePdf,
    FaFileExcel,
    FaHistory,
    FaUser,
    FaClock,
} from "react-icons/fa";
import {
    FiEye,
    FiRefreshCw,
    FiCalendar,
    FiActivity,
    FiGlobe,
} from "react-icons/fi";
import Breadcrumb from "@/Components/Breadcrumb";
import moment from "moment";
import axios from "axios";
import Modal from "@/Components/Modal";

const Index = ({ auditLogs: propAuditLogs, filters: propFilters = {} }) => {
    const { props } = usePage();

    // Try multiple possible data sources for audit logs
    const auditLogs = propAuditLogs ||
        props.auditLogs ||
        props.initialAuditLogs ||
        props.audit_logs || {
            data: [],
            current_page: 1,
            per_page: 10,
            last_page: 1,
            total: 0,
        };

    const filters = propFilters || props.filters || {};

    const [selectedLog, setSelectedLog] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Use the audit logs data (should now be properly paginated from backend)
    const finalAuditLogs = auditLogs;

    // Pagination state
    const pageSizes = [10, 25, 50, 100];
    const [pageSize, setPageSize] = useState(finalAuditLogs.per_page || 10);

    const openDetails = (log) => {
        setSelectedLog(log);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedLog(null);
    };

    const onPageSizeChange = (size) => {
        setPageSize(size);
        window.location = route("audit-logs.index", {
            ...filters,
            per_page: size,
        });
    };

    const getEventClass = (event) => {
        switch (event.toLowerCase()) {
            case "created":
                return "bg-green-500";
            case "updated":
                return "bg-blue-500";
            case "deleted":
                return "bg-red-500";
            case "login":
                return "bg-purple-500";
            case "logout":
                return "bg-yellow-500";
            default:
                return "bg-gray-500";
        }
    };

    const headWeb = "Audit Logs";
    const linksBreadcrumb = [
        { title: "Home", url: route("dashboard") },
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
                                action={route("audit-logs.index")}
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
                                        placeholder="Search in Audit Logs"
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
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Export Dropdown */}
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
                                                            "audit-logs.export-direct",
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
                                                            "audit-logs.export-direct",
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
                        </div>
                    </div>
                </div>

                {/* Header with Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaHistory className="text-blue-500" />
                                {headWeb}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Track and monitor system activities and changes
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-3 rounded-lg shadow-sm shadow-blue-600">
                                <div className="flex items-center gap-2">
                                    <FiActivity className="text-white w-5 h-5" />
                                    <span className="text-md font-medium text-white">
                                        Total Logs {finalAuditLogs.total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Audit Logs Table */}
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
                                            <FiCalendar className="w-4 h-4" />
                                            Date
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaUser className="w-4 h-4" />
                                            User
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiActivity className="w-4 h-4" />
                                            Type
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaClock className="w-4 h-4" />
                                            Event
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiGlobe className="w-4 h-4" />
                                            IP Address
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
                                {finalAuditLogs.data &&
                                finalAuditLogs.data.length > 0 ? (
                                    finalAuditLogs.data.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-gray-100 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {moment(log.date).format(
                                                        "MMM D, YYYY"
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {moment(log.date).format(
                                                        "HH:mm:ss"
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {log.user}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {log.type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getEventClass(
                                                        log.event
                                                    )}`}
                                                >
                                                    {log.event}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">
                                                    {log.ip_address}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openDetails(log)
                                                        }
                                                        className="flex items-center gap-2 text-white bg-blue-600 p-2 rounded-2xl transition-all duration-300 hover:bg-blue-700"
                                                        title="View Details"
                                                    >
                                                        <FiEye className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            View
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No audit logs found.
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
                                {finalAuditLogs.total}
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
                            {finalAuditLogs.current_page && (
                                <>
                                    <div>
                                        Page {finalAuditLogs.current_page} of{" "}
                                        {finalAuditLogs.last_page}
                                    </div>
                                    <div className="flex space-x-1">
                                        <Link
                                            href={
                                                finalAuditLogs.prev_page_url ||
                                                "#"
                                            }
                                            className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                                !finalAuditLogs.prev_page_url
                                                    ? "opacity-50 pointer-events-none"
                                                    : ""
                                            }`}
                                        >
                                            «
                                        </Link>
                                        <Link
                                            href={
                                                finalAuditLogs.next_page_url ||
                                                "#"
                                            }
                                            className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                                !finalAuditLogs.next_page_url
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

            {/* Details Modal */}
            <Modal show={showModal} onClose={closeModal}>
                <div className="p-6">
                    {selectedLog && (
                        <>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                {selectedLog.details.summary}
                            </h2>
                            <div className="mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <strong className="text-gray-700 dark:text-gray-300">
                                            Date:
                                        </strong>
                                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            {moment(selectedLog.date).format(
                                                "YYYY-MM-DD HH:mm:ss"
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <strong className="text-gray-700 dark:text-gray-300">
                                            User:
                                        </strong>
                                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            {selectedLog.user}
                                        </div>
                                    </div>
                                    <div>
                                        <strong className="text-gray-700 dark:text-gray-300">
                                            Event:
                                        </strong>
                                        <div className="mt-1">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getEventClass(
                                                    selectedLog.event
                                                )}`}
                                            >
                                                {selectedLog.event}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {selectedLog.details.changes &&
                                    selectedLog.details.changes.length > 0 && (
                                        <div className="mt-4">
                                            <strong className="text-gray-700 dark:text-gray-300 block mb-2">
                                                Changes:
                                            </strong>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200 border dark:border-gray-600">
                                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                                Field
                                                            </th>
                                                            {selectedLog.event ===
                                                                "updated" && (
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                                    Old Value
                                                                </th>
                                                            )}
                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                                                                {selectedLog.event ===
                                                                "deleted"
                                                                    ? "Deleted Value"
                                                                    : "New Value"}
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                                        {selectedLog.details.changes.map(
                                                            (change, idx) => (
                                                                <tr
                                                                    key={idx}
                                                                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                >
                                                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                                                                        {
                                                                            change.field
                                                                        }
                                                                    </td>
                                                                    {selectedLog.event ===
                                                                        "updated" && (
                                                                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                                            {change.old_value ||
                                                                                "-"}
                                                                        </td>
                                                                    )}
                                                                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                                                        {selectedLog.event ===
                                                                        "deleted"
                                                                            ? change.old_value ||
                                                                              "-"
                                                                            : change.new_value ||
                                                                              "-"}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Close
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
};

export default Index;
