import React, { useState, Fragment, useEffect } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Listbox, Transition, Menu } from "@headlessui/react";
import {
    FaSearch,
    FaChevronDown,
    FaFilePdf,
    FaFileExcel,
    FaArrowLeft,
    FaFilter,
    FaPrint,
    FaMoneyBillWave,
    FaRegMoneyBillAlt,
    FaPercentage,
    FaReceipt,
} from "react-icons/fa";
import {
    FiTrash2,
    FiEye,
    FiDollarSign,
    FiUser,
    FiShoppingBag,
    FiList,
    FiRefreshCw,
} from "react-icons/fi";
import { HiOutlineCurrencyDollar } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";

export default function OrderIndex() {
    const { orders, filters = {}, auth } = usePage().props;
    const { t } = useTranslation();
    const isAdmin = auth?.user?.roles?.some((role) => role.name === "Admin");

    // Real-time order list state
    const [orderList, setOrderList] = useState(orders.data || []);
    const [totalOrders, setTotalOrders] = useState(orders.total || 0);

    // Real-time order updates
    useEffect(() => {
        if (window.Echo) {
            const orderChannel = window.Echo.channel("orders");
            orderChannel.listen(".order-notification", function (data) {
                if (data.action === "created") {
                    window.location.reload();
                } else if (data.action === "deleted") {
                    setOrderList((prevOrders) =>
                        prevOrders.filter(
                            (order) => order.order_id !== data.orderId
                        )
                    );
                    setTotalOrders((prev) => prev - 1);
                }
            });
            return () => {
                try {
                    window.Echo.leaveChannel("orders");
                } catch (error) {}
            };
        }
    }, []);

    // Update local state when props change (e.g., page change, filter)
    useEffect(() => {
        setOrderList(orders.data || []);
        setTotalOrders(orders.total || 0);
    }, [orders]);

    // Delete flow
    const [confirmingDelete, setConfirmingDelete] = useState(false);
    const [toDelete, setToDelete] = useState(null);
    const {
        delete: destroy,
        data,
        setData,
        processing,
        reset,
    } = useForm({
        id: "",
    });

    function confirmDelete(order) {
        setToDelete(order);
        setData("id", order.order_id);
        setConfirmingDelete(true);
    }

    function closeModal() {
        setConfirmingDelete(false);
        reset();
        setToDelete(null);
    }

    function deleteRow(e) {
        e.preventDefault();
        destroy(route("orders.destroy", { id: data.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setOrderList((prevOrders) =>
                    prevOrders.filter(
                        (order) => order.order_id !== parseInt(data.id)
                    )
                );
                setTotalOrders((prev) => prev - 1);
                closeModal();
            },
        });
    }

    // Rows-per-page Listbox
    const pageSizes = [10, 25, 50, 100];
    const [pageSize, setPageSize] = useState(orders.per_page);
    function onPageSizeChange(size) {
        setPageSize(size);
        window.location = route("orders.index", { ...filters, per_page: size });
    }

    // Payment status local toggle state (optional)
    const [paymentStatuses, setPaymentStatuses] = useState({});
    const togglePaidLocal = (orderId) => {
        setPaymentStatuses((prev) => ({
            ...prev,
            [orderId]: prev[orderId] === "paid" ? "unpaid" : "paid",
        }));
    };

    const head = isAdmin ? t('orders.title') : t('orders.orderHistory');
    const crumbs = [
        { title: t('menu.dashboard'), url: route('dashboard') },
        { title: head, url: '' },
    ];

    // Format total payment depending on the currency
    function formatAmount(amount, currency) {
        const amountNumber = isNaN(amount) ? 0 : parseFloat(amount);
        if (currency === "KHR") {
            return `${(amountNumber * 4000).toLocaleString()} ៛`;
        } else {
            return `$${amountNumber.toFixed(2)}`;
        }
    }

    return (
        <AdminLayout breadcrumb={<Breadcrumb header={head} links={crumbs} />}>
            <Head title={head} />

            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Search and Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center max-w-md w-full space-x-2">
                            <form
                                method="get"
                                action={route("orders.index")}
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
                                            "orders.searchPlaceholder"
                                        )}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 duration-200 transition hover:bg-green-600"
                                >
                                    <FaSearch className="w-4 h-4" />
                                    <span>{t("common.search")}</span>
                                </button>
                            </form>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Export Dropdown */}
                            <Menu as="div" className="relative">
                                <Menu.Button className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition duration-200 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">                                                                                        <span className="flex items-center">
                                                                                        <FiRefreshCw className="w-4 h-4 mr-2" />
                                                                                        {t('orders.exportButton')}
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
                                                            "orders.export",
                                                            {
                                                                format: "pdf",
                                                                ...filters,
                                                            }
                                                        )}
                                                        target="_blank"
                                                        className={`flex items-center px-4 py-3 text-sm transition duration-200 ${
                                                            active
                                                                ? "bg-gray-100  text-gray-900 dark:text-white"
                                                                : "text-gray-700 dark:text-gray-200"
                                                        }`}
                                                    >
                                                        <FaFilePdf className="mr-3 h-5 w-5 text-red-500" />
                                                        <div>
                                                            <div className="font-medium">{t('orders.export.pdf')}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Portable Document Format</div>
                                                        </div>
                                                    </a>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <a
                                                        href={route(
                                                            "orders.export",
                                                            {
                                                                format: "excel",
                                                                ...filters,
                                                            }
                                                        )}
                                                        target="_blank"
                                                        className={`flex items-center px-4 py-3 text-sm transition duration-200 ${
                                                            active
                                                                ? "bg-gray-100  text-gray-900 dark:text-white"
                                                                : "text-gray-700 "
                                                        }`}
                                                    >
                                                        <FaFileExcel className="mr-3 h-5 w-5 text-green-600" />
                                                        <div>
                                                            <div className="font-medium">{t('orders.export.excel')}</div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Microsoft Excel Spreadsheet</div>
                                                        </div>
                                                    </a>
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>

                            {/* Back Button (staff only) */}
                            {!isAdmin && (
                                <Link
                                    href={route("orders.create")}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    <FaArrowLeft className="mr-2 h-4 w-4" />
                                    {t('orders.backToOrder')}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Header with Stats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FaReceipt className="text-blue-500" />
                                {head}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {t('orders.manageAndTrack')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 ">
                            <div className="bg-blue-500 p-3 rounded-lg shadow-sm shadow-blue-600">
                                <div className="flex items-center gap-2">
                                    <HiOutlineCurrencyDollar className="text-white w-5 h-5" />
                                    <span className="text-md font-medium text-white">{t('orders.totalOrders')} {totalOrders}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-blue-500">                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            <div className="flex items-center gap-1">
                                                <FiList className="w-4 h-4" />
                                                {t('orders.table.id')}
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            <div className="flex items-center gap-1">
                                                <FiUser className="w-4 h-4" />
                                                {t('orders.table.customer')}
                                            </div>
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                            <div className="flex items-center gap-1">
                                                <FiShoppingBag className="w-4 h-4" />
                                                {t('orders.table.productTitle')}
                                            </div>
                                        </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        <div className="flex items-center gap-1">
                                            <FaRegMoneyBillAlt className="w-4 h-4" />
                                            {t('orders.table.subTotal')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaPercentage className="w-4 h-4" />
                                            {t('orders.table.discount')}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaMoneyBillWave className="w-4 h-4" />
                                            {t('orders.table.total')}
                                        </div>
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        {t('orders.table.status')}
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                        {t('orders.table.actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white ">
                                {orderList.length > 0 ? (
                                    orderList.map((order, idx) => {
                                        const status =
                                            paymentStatuses[order.order_id] ??
                                            (order.total_payment > 0
                                                ? "paid"
                                                : "unpaid");
                                        const productTitles = order.items
                                            ? order.items
                                                  .map(
                                                      (item) =>
                                                          item.product
                                                              .product_title
                                                  )
                                                  .join(", ")
                                            : "No Products";

                                        return (
                                            <tr
                                                key={order.order_id}
                                                className="hover:bg-gray-100 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Link
                                                        href={route(
                                                            "invoices.show",
                                                            {
                                                                id: order.order_id,
                                                            }
                                                        )}
                                                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                    >
                                                        <span>
                                                            #{order.order_id}
                                                        </span>
                                                    </Link>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        {new Date(
                                                            order.created_at
                                                        ).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-600">
                                                        {order.customer?.name ||
                                                            "N/A"}
                                                    </div>
                                                    {order.customer?.email && (
                                                        <div className="text-xs text-gray-500 ">
                                                            {
                                                                order.customer
                                                                    .email
                                                            }
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500 line-clamp-2">
                                                        {productTitles}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-500">
                                                        {formatAmount(
                                                            order.sub_total,
                                                            order.currency
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div
                                                        className={`text-sm ${
                                                            order.discount > 0
                                                                ? "text-red-500 "
                                                                : "text-gray-500 "
                                                        }`}
                                                    >
                                                        {order.discount}%
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-semibold text-gray-500">
                                                        {formatAmount(
                                                            order.total_payment,
                                                            order.currency
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3.5 py-1.5 rounded-full text-xs font-medium ${status === 'paid'
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                                        }`}>
                                                        {status === 'paid' ? t('orders.status.paid') : t('orders.status.pending')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                confirmDelete(
                                                                    order
                                                                )
                                                            }
                                                            disabled={
                                                                processing &&
                                                                data.id ===
                                                                    order.order_id
                                                            }
                                                            className={`flex items-center gap-2 text-white bg-red-600 p-2 rounded-2xl transition-all duration-300 
            hover:bg-red-700 hover:text-red-800 
            ${
                processing && data.id === order.order_id
                    ? "opacity-50 cursor-not-allowed"
                    : ""
            }`}
                                                            title="Delete Order"
                                                        >
                                                            <FiTrash2 className="h-5 w-5" />
                                                            <span className="text-sm font-medium">
                                                                {t('orders.actions.delete')}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            No orders found. Try adjusting your
                                            search or filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            {t('orders.totalRows')}{" "}
                            <span className="font-medium">{totalOrders}</span>{" "}
                            {t('orders.rows')}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span>{t('orders.rowsPerPage')}</span>
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
                                {t('orders.pageOf')} {orders.current_page} / {orders.last_page}
                            </div>
                            <div className="flex space-x-1">
                                <Link
                                    href={orders.prev_page_url || "#"}
                                    className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                        !orders.prev_page_url
                                            ? "opacity-50 pointer-events-none"
                                            : ""
                                    }`}
                                >
                                    «
                                </Link>
                                <Link
                                    href={orders.next_page_url || "#"}
                                    className={`px-2 py-1 border rounded hover:bg-gray-100 ${
                                        !orders.next_page_url
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
                <form onSubmit={deleteRow} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">{t('orders.confirmDelete')}</h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {t('orders.confirmDeleteMessage')} <strong>#{toDelete?.order_id}</strong>?
                    </p>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            {t('orders.cancel')}
                        </button>
                        <DangerButton type="submit" disabled={processing}>
                            {processing ? t('orders.actions.deleteButton') + '...' : t('orders.actions.deleteButton')}
                        </DangerButton>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
