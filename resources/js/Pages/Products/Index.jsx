import React, { useState, Fragment, useEffect } from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import { Listbox, Transition, Menu } from "@headlessui/react";
import {
    FaSearch,
    FaChevronDown,
    FaFilePdf,
    FaFileExcel,
    FaFileUpload,
    FaBoxOpen,
    FaShoppingCart,
    FaPercentage,
    FaBarcode,
} from "react-icons/fa";
import {
    FiEdit2,
    FiTrash2,
    FiEye,
    FiUpload,
    FiEdit,
    FiShoppingBag,
    FiDollarSign,
    FiPackage,
    FiCalendar,
    FiRefreshCw,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";

export default function ProductPage() {
    const { t } = useTranslation();
    const {
        productData: products = {
            data: [],
            current_page: 1,
            per_page: 10,
            last_page: 1,
            total: 0,
        },
        filters = {},
        colors = [],
    } = usePage().props;

    const [showImportModal, setShowImportModal] = useState(false);

    // Real-time product list state
    const [productList, setProductList] = useState(products.data || []);
    const [totalProducts, setTotalProducts] = useState(products.total || 0);

    // Real-time product updates
    useEffect(() => {
        if (window.Echo) {
            const productChannel = window.Echo.channel("products");

            productChannel.listen(".product-changed", function (data) {
                if (data.action === "created") {
                    window.location.reload();
                } else if (data.action === "updated") {
                    setProductList((prevProducts) =>
                        prevProducts.map((product) =>
                            product.product_id === data.productId
                                ? {
                                      ...product,
                                      product_title: data.productTitle,
                                      product_price: data.price,
                                  }
                                : product
                        )
                    );
                } else if (data.action === "deleted") {
                    setProductList((prevProducts) =>
                        prevProducts.filter(
                            (product) => product.product_id !== data.productId
                        )
                    );
                    setTotalProducts((prev) => Math.max(0, prev - 1));
                }
            });

            return () => {
                try {
                    window.Echo.leaveChannel("products");
                } catch (error) {
                }
            };
        }
    }, []);

    // Update local state when props change
    useEffect(() => {
        setProductList(products.data || []);
        setTotalProducts(products.total || 0);
    }, [products]);

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

    // Stock editing state
    const [showStockModal, setShowStockModal] = useState(false);
    const [stockEditProduct, setStockEditProduct] = useState(null);
    const [newStock, setNewStock] = useState("");

    function openStockModal(product) {
        setStockEditProduct(product);
        setNewStock(product.product_stock);
        setShowStockModal(true);
    }

    function closeStockModal() {
        setShowStockModal(false);
        setStockEditProduct(null);
        setNewStock("");
    }

    async function updateStock() {
        if (!stockEditProduct) return;
        try {
            const res = await fetch(
                `/products/${stockEditProduct.product_id}/update-stock`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-TOKEN": document.querySelector(
                            'meta[name="csrf-token"]'
                        ).content,
                    },
                    body: JSON.stringify({ stock: newStock }),
                }
            );
            if (res.ok) {
                setProductList((prevProducts) =>
                    prevProducts.map((product) =>
                        product.product_id === stockEditProduct.product_id
                            ? { ...product, product_stock: parseInt(newStock) }
                            : product
                    )
                );
                closeStockModal();
            } else {
                alert("Failed to update stock");
            }
        } catch (e) {
            alert("Error updating stock");
        }
    }

    function confirmDelete(product) {
        setToDelete(product);
        setData("id", product.product_id);
        setConfirmingDelete(true);
    }

    function closeModal() {
        setConfirmingDelete(false);
        reset();
        setToDelete(null);
    }

    function deleteRow(e) {
        e.preventDefault();
        destroy(route("products.destroy", { id: data.id }), {
            preserveScroll: true,
            onSuccess: () => {
                setProductList((prevProducts) =>
                    prevProducts.filter(
                        (product) => product.product_id !== parseInt(data.id)
                    )
                );
                setTotalProducts((prev) => prev - 1);
                closeModal();
            },
        });
    }

    const handleFileChange = (e) => {
        setData("excel_file", e.target.files[0]);
    };

    const handleImport = (e) => {
        e.preventDefault();
        const formData = new FormData();

        // Check if file exists
        if (!data.excel_file) {
            alert("Please select a file to import");
            return;
        }

        // Use 'file' as the field name to match backend validation
        formData.append("file", data.excel_file);

        router.post(route("products.import"), formData, {
            onSuccess: () => {
                setShowImportModal(false);
                setData("excel_file", null);
                window.location.reload(); // Refresh to show new data
            },
            onError: (errors) => {
                

                // Handle different error formats
                let errorMessage = "An error occurred during import";

                if (typeof errors === "string") {
                    errorMessage = errors;
                } else if (errors && typeof errors === "object") {
                    if (errors.file) {
                        errorMessage = Array.isArray(errors.file)
                            ? errors.file[0]
                            : errors.file;
                    } else if (errors.error) {
                        errorMessage = errors.error;
                    } else if (errors.message) {
                        errorMessage = errors.message;
                    } else if (errors.details) {
                        errorMessage = errors.details;
                    } else {
                        // Try to extract any error message from the object
                        const firstError = Object.values(errors)[0];
                        if (firstError) {
                            errorMessage = Array.isArray(firstError)
                                ? firstError[0]
                                : firstError;
                        }
                    }
                }

                // Show the error in a more user-friendly way
                alert(errorMessage);
            },
            preserveScroll: true,
            preserveState: true,
            headers: {
                Accept: "application/json",
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

    // --- Rows‐per‐page Listbox ---
    const pageSizes = [10, 25, 50, 100];
    const [pageSize, setPageSize] = useState(products.per_page);

    function onPageSizeChange(size) {
        setPageSize(size);
        window.location = route("products.index", {
            ...filters,
            per_page: size,
        });
    }

    // Breadcrumb & header
    const headWeb = t("products.title");
    const crumbs = [
        { title: t("menu.dashboard"), url: route("dashboard") },
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
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full sm:max-w-4xl gap-2">
                            <form
                                method="get"
                                action={route("products.index")}
                                className="flex flex-col sm:flex-row items-stretch sm:items-center w-full gap-2"
                            >
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaSearch className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="search"
                                        defaultValue={filters?.search || ""}
                                        placeholder={t(
                                            "products.searchPlaceholder"
                                        )}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Color Filter */}
                                <div className="relative sm:w-48">
                                    <select
                                        name="color_id"
                                        defaultValue={filters?.color_id || ""}
                                        className="block w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                                    >
                                        <option value="">
                                            {t("products.allColors")}
                                        </option>
                                        {colors.map((color) => (
                                            <option
                                                key={color.color_id}
                                                value={color.color_id}
                                            >
                                                {color.color_title}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaChevronDown className="h-4 w-4 text-gray-400" />
                                    </div>
                                </div>

                                {/* Submit button */}
                                <button
                                    type="submit"
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 duration-200 transition hover:bg-green-600 sm:w-auto"
                                >
                                    <FaSearch className="w-4 h-4" />
                                    <span>{t("common.search")}</span>
                                </button>
                            </form>
                        </div>

                        <div className="flex items-center gap-3 flex-nowrap">
                            {/* Import Button */}
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition duration-200 text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
                            >
                                <FiUpload className="w-4 h-4 mr-2" />
                                {t("products.import")}
                            </button>

                            {/* Export Dropdown */}
                            <Menu as="div" className="relative">
                                <Menu.Button className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm transition duration-200 text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 whitespace-nowrap">
                                    <span className="flex items-center">
                                        <FiRefreshCw className="w-4 h-4 mr-2" />
                                        {t("common.export")}
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
                                                            "products.export",
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
                                                                {t("export.pdf.title")}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {t("export.pdf.description")}
                                                            </div>
                                                        </div>
                                                    </a>
                                                )}
                                            </Menu.Item>
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <a
                                                        href={route(
                                                            "products.export",
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
                                                                {t("export.excel.title")}
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {t("export.excel.description")}
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
                                <FaBoxOpen className="text-blue-500" />
                                {headWeb}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {t('products.manageAndTrack')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500 p-3 rounded-lg shadow-sm shadow-blue-600">
                                <div className="flex items-center gap-2">
                                    <FiShoppingBag className="text-white w-5 h-5" />
                                    <span className="text-md font-medium text-white">
                                        {t('products.totalProducts')} {totalProducts}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-green-500 p-3 rounded-lg shadow-sm shadow-green-600">
                                <div className="flex items-center gap-2">
                                    <FiPackage className="text-white w-5 h-5" />
                                    <span className="text-md font-medium text-white">
                                        {t('products.totalStock')}{" "}
                                        {
                                            productList.filter(
                                                (p) => p.product_stock > 0
                                            ).length
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
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
                                            {t("products.table.id")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiEye className="w-4 h-4" />
                                            {t("products.table.image")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiShoppingBag className="w-4 h-4" />
                                            {t("products.table.title")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaBarcode className="w-4 h-4" />
                                            {t("products.table.code")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiDollarSign className="w-4 h-4" />
                                            {t("products.table.price")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaBoxOpen className="w-4 h-4" />
                                            {t("products.table.stock")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FiEdit className="w-4 h-4" />
                                            {t("products.table.updateStock")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        <div className="flex items-center gap-1">
                                            <FaPercentage className="w-4 h-4" />
                                            {t("products.table.status")}
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                                    >
                                        {t("products.table.actions")}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {productList.length > 0 ? (
                                    productList.map((product, idx) => (
                                        <tr
                                            key={product.product_id}
                                            className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {(products.current_page -
                                                        1) *
                                                        products.per_page +
                                                        idx +
                                                        1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600">
                                                    {product.images &&
                                                    product.images.length >
                                                        0 ? (
                                                        <img
                                                            src={`/storage/${product.images[0].image_path}`}
                                                            alt={
                                                                product.product_title
                                                            }
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-300">
                                                            <FiShoppingBag className="h-6 w-6" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {product.product_title}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {product.product_code}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    ${product.product_price}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {product.product_stock}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() =>
                                                        openStockModal(product)
                                                    }
                                                    className="flex items-center gap-2 text-white bg-green-600 p-2 rounded-2xl transition-all duration-300 hover:bg-green-700"
                                                    title="Update Stock"
                                                >
                                                    <FiEdit className="h-4 w-4" />
                                                    <span className="text-sm font-medium">
                                                        {t("products.actions.stock")}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        product.product_stock >
                                                            0 &&
                                                        product.product_status
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                    }`}
                                                >
                                                    {product.product_stock >
                                                        0 &&
                                                    product.product_status
                                                        ? t(
                                                              "products.status.active"
                                                          )
                                                        : t(
                                                              "products.status.inactive"
                                                          )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={route(
                                                            "products.show",
                                                            {
                                                                id: product.product_id,
                                                            }
                                                        )}
                                                        className="flex items-center gap-2 text-white bg-gray-500 p-2 rounded-2xl transition-all duration-300 hover:bg-gray-600"
                                                        title="View Product"
                                                    >
                                                        <FiEye className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            {t("products.actions.detail")}
                                                        </span>
                                                    </Link>
                                                    <Link
                                                        href={route(
                                                            "products.edit",
                                                            {
                                                                id: product.product_id,
                                                            }
                                                        )}
                                                        className="flex items-center gap-2 text-white bg-blue-600 p-2 rounded-2xl transition-all duration-300 hover:bg-blue-700"
                                                        title="Edit Product"
                                                    >
                                                        <FiEdit2 className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            {t("products.actions.edit")}
                                                        </span>
                                                    </Link>
                                                    <button
                                                        onClick={() =>
                                                            confirmDelete(
                                                                product
                                                            )
                                                        }
                                                        disabled={
                                                            processing &&
                                                            data.id ===
                                                                product.product_id
                                                        }
                                                        className={`flex items-center gap-2 text-white bg-red-600 p-2 rounded-2xl transition-all duration-300 hover:bg-red-700 ${
                                                            processing &&
                                                            data.id ===
                                                                product.product_id
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : ""
                                                        }`}
                                                        title="Delete Product"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                        <span className="text-sm font-medium">
                                                            {t("products.actions.delete")}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="9"
                                            className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                        >
                                            {t("products.noProductsFound")}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            {t('products.totalRows')}{" "}
                            <span className="font-medium">{totalProducts}</span>{" "}
                            {t('products.rows')}
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <span>{t('products.rowsPerPage')}</span>
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
                            {products.current_page && (
                                <>
                                    <div>
                                        {t('products.pageOf')} {products.current_page}  {t('products.Of')}{" "}
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
                                </>
                            )}
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
                        Import Products
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
                                Drag Excel file here to import product
                                information
                            </p>
                            <p className="text-sm text-gray-500 mb-3">
                                or click to browse, up to (5 MB max)
                            </p>
                            <div className="flex justify-center">
                                <input
                                    type="file"
                                    name="excel_file"
                                    id="excel_file"
                                    accept=".xlsx,.xls"
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

            {/* Delete confirmation modal */}
            <Modal show={confirmingDelete} onClose={closeModal}>
                <form onSubmit={deleteRow} className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Confirm Deletion
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete product{" "}
                        <strong>{toDelete?.product_title}</strong>? This action
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
                            {processing ? "Deleting..." : "Delete Product"}
                        </DangerButton>
                    </div>
                </form>
            </Modal>

            {/* Stock editing modal */}
            <Modal show={showStockModal} onClose={closeStockModal}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <FiEdit className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                {t("products.updateStockTitle")}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t("products.updateStockDesc")}
                            </p>
                        </div>
                    </div>

                    {stockEditProduct && (
                        <>
                            <div className="mt-4">
                                <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        {t("products.product")}:
                                    </span>
                                    <span className="ml-2 text-gray-900 ">
                                        {stockEditProduct.product_title}
                                    </span>
                                </div>
                                <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        {t("products.color")}:
                                    </span>
                                    <span className="ml-2 text-gray-900">
                                        {stockEditProduct.color?.color_title ||
                                            "N/A"}
                                    </span>
                                </div>
                                <div className="mb-4">
                                    <span className="text-sm font-medium text-gray-700">
                                        {t("products.currentStock")}:
                                    </span>
                                    <span className="ml-2 font-medium text-gray-900">
                                        {stockEditProduct.product_stock}
                                    </span>
                                </div>

                                <label
                                    htmlFor="newStock"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    {t("products.newStockQuantity")}
                                </label>
                                <input
                                    id="newStock"
                                    type="number"
                                    min="0"
                                    value={newStock}
                                    onChange={(e) =>
                                        setNewStock(e.target.value)
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={t("products.enterNewQuantity")}
                                />
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeStockModal}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {t("products.cancel")}
                                </button>
                                <button
                                    type="button"
                                    onClick={updateStock}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    {t("products.updateStock")}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </AdminLayout>
    );
}
