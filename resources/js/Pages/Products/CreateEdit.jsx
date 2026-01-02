import { Head, Link, useForm } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { useEffect, useState } from "react";
import { FiSave, FiX, FiPlusCircle, FiEdit2 } from "react-icons/fi";
import Breadcrumb from "@/Components/Breadcrumb";
import InputError from "@/Components/InputError";
import AdminLayout from "@/Layouts/AdminLayout";

export default function ProductCreateEdit({
    datas = null,
    categories = [],
    brands = [],
    makers = [],
    sizes = [],
    colors = [],
}) {
    const isEdit = Boolean(datas && datas.product_id);
    const {
        data,
        setData,
        post,
        patch,
        errors,
        processing,
        recentlySuccessful,
    } = useForm({
        product_title: datas?.product_title || "",
        product_code: datas?.product_code || "",
        product_description: datas?.product_description || "",
        product_price: datas?.product_price || "",
        product_stock: datas?.product_stock || "",
        product_status: datas?.product_status ?? true,
        product_ram: datas?.product_ram || "",
        category_id: datas?.category_id || "",
        brand_id: datas?.brand_id || "",
        maker_id: datas?.maker_id || "",
        size_id: datas?.size_id || "",
        color_id: datas?.color_id || "",
        images: [],
        deleted_images: [],
    });

    const [imagePreviews, setImagePreviews] = useState(
        datas?.images?.map((img) => `/storage/${img.image_path}`) || []
    );

    function submit(e) {
        e.preventDefault();

        const formData = new FormData();

        // Handle all form fields
        Object.keys(data).forEach((key) => {
            if (key === "images" || key === "deleted_images") return;
            if (key === "product_status") {
                formData.append(key, data[key] ? 1 : 0);
            } else if (data[key] !== null && data[key] !== "") {
                formData.append(key, data[key]);
            }
        });

        // Handle images
        if (data.images && data.images.length > 0) {
            data.images.forEach((file) => {
                formData.append("images[]", file);
            });
        }

        if (isEdit && data.deleted_images && data.deleted_images.length > 0) {
            data.deleted_images.forEach((id) => {
                formData.append("deleted_images[]", id);
            });
        }

        if (isEdit) {
            patch(route("products.update", datas.product_id), formData, {
                forceFormData: true,
                preserveScroll: true,
            });
        } else {
            post(route("products.store"), formData, {
                forceFormData: true,
                preserveScroll: true,
            });
        }
    }

    function handleImageChange(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const invalidFiles = files.filter(
                (file) => !file.type.startsWith("image/")
            );
            if (invalidFiles.length > 0) {
                return;
            }

            setData("images", [...data.images, ...files]);
            const newPreviews = files.map((file) => URL.createObjectURL(file));
            setImagePreviews((prev) => [...prev, ...newPreviews]);
        }
        e.target.value = null;
    }

    function removeImage(index) {
        const existingImagesCount = datas?.images?.length || 0;
        const urlToRevoke = imagePreviews[index];

        if (urlToRevoke?.startsWith("blob:")) {
            URL.revokeObjectURL(urlToRevoke);
        }

        if (index < existingImagesCount) {
            const imageId = datas.images[index].product_image_id;
            setData("deleted_images", [
                ...(data.deleted_images || []),
                imageId,
            ]);
        } else {
            const newImages = [...data.images];
            const adjustedIndex = index - existingImagesCount;
            newImages.splice(adjustedIndex, 1);
            setData("images", newImages);
        }

        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    }

    useEffect(() => {
        return () => {
            imagePreviews.forEach((url) => {
                if (url.startsWith("blob:")) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [imagePreviews]);

    const title = isEdit ? "Edit Product" : "Create New Product";
    const crumbs = [
        { title: "Home", url: route("dashboard") },
        { title: "Products", url: route("products.index") },
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
                                ? "Update existing product details below"
                                : "Add a new product to the system"}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="flex-1 overflow-y-auto px-8 py-8 space-y-8"
                    encType="multipart/form-data"
                >
                    {/* Error messages */}
                    {errors.error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl shadow-sm">
                            {errors.error}
                        </div>
                    )}

                    {Object.keys(errors).length > 0 &&
                        Object.keys(errors).some((key) => key !== "error") && (
                            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-xl shadow-sm">
                                <p className="font-bold">
                                    Please fix the following errors:
                                </p>
                                <ul className="list-disc pl-5">
                                    {Object.entries(errors)
                                        .filter(([field]) => field !== "error")
                                        .map(([field, message]) => (
                                            <li key={field}>
                                                {field}: {message}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        )}

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="product_title"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="product_title"
                                type="text"
                                value={data.product_title}
                                onChange={(e) =>
                                    setData("product_title", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.product_title
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                placeholder="Enter product title"
                                autoFocus
                            />
                            <InputError
                                message={errors.product_title}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="product_code"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="product_code"
                                type="text"
                                value={data.product_code}
                                onChange={(e) =>
                                    setData("product_code", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.product_code
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                placeholder="Enter product code"
                            />
                            <InputError
                                message={errors.product_code}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="product_description"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                            Description
                        </label>
                        <textarea
                            id="product_description"
                            value={data.product_description}
                            onChange={(e) =>
                                setData("product_description", e.target.value)
                            }
                            rows={4}
                            className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                ${
                                    errors.product_description
                                        ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                        : ""
                                }
                                transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                            placeholder="Enter product description"
                        />
                        <InputError
                            message={errors.product_description}
                            className="mt-2 text-sm text-red-500 dark:text-red-400"
                        />
                    </div>

                    {/* Pricing and Stock */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="product_price"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Price <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 dark:text-gray-400">
                                        $
                                    </span>
                                </div>
                                <input
                                    id="product_price"
                                    type="number"
                                    step="0.01"
                                    value={data.product_price}
                                    onChange={(e) =>
                                        setData("product_price", e.target.value)
                                    }
                                    className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100 pl-8
                                        focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                        ${
                                            errors.product_price
                                                ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                                : ""
                                        }
                                        transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                    placeholder="0.00"
                                />
                            </div>
                            <InputError
                                message={errors.product_price}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="product_stock"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Stock <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="product_stock"
                                type="number"
                                value={data.product_stock}
                                onChange={(e) =>
                                    setData("product_stock", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.product_stock
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                placeholder="Enter stock quantity"
                            />
                            <InputError
                                message={errors.product_stock}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    {/* Categories and Specifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="category_id"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Category <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="category_id"
                                value={data.category_id}
                                onChange={(e) =>
                                    setData("category_id", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.category_id
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                            >
                                <option value="">Select Category</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.category_id}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="brand_id"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Brand
                            </label>
                            <select
                                id="brand_id"
                                value={data.brand_id}
                                onChange={(e) =>
                                    setData("brand_id", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.brand_id
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                            >
                                <option value="">Select Brand</option>
                                {brands.map((brand) => (
                                    <option
                                        key={brand.brand_id}
                                        value={brand.brand_id}
                                    >
                                        {brand.brand_title}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.brand_id}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="maker_id"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Maker
                            </label>
                            <select
                                id="maker_id"
                                value={data.maker_id}
                                onChange={(e) =>
                                    setData("maker_id", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.maker_id
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                            >
                                <option value="">Select Maker</option>
                                {makers.map((maker) => (
                                    <option
                                        key={maker.maker_id}
                                        value={maker.maker_id}
                                    >
                                        {maker.maker_title}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.maker_id}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="size_id"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Size{" "}
                                <span className="text-gray-400 text-xs">
                                    (Optional)
                                </span>
                            </label>
                            <select
                                id="size_id"
                                value={data.size_id}
                                onChange={(e) =>
                                    setData("size_id", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.size_id
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                            >
                                <option value="">Select Size (Optional)</option>
                                {sizes.map((size) => (
                                    <option
                                        key={size.size_id}
                                        value={size.size_id}
                                    >
                                        {size.size_title}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.size_id}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="color_id"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Color
                            </label>
                            <select
                                id="color_id"
                                value={data.color_id}
                                onChange={(e) =>
                                    setData("color_id", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.color_id
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                            >
                                <option value="">Select Color</option>
                                {colors.map((color) => (
                                    <option
                                        key={color.color_id}
                                        value={color.color_id}
                                    >
                                        {color.color_title}
                                    </option>
                                ))}
                            </select>
                            <InputError
                                message={errors.color_id}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="product_ram"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                RAM (GB){" "}
                                <span className="text-gray-400 text-xs">
                                    (Optional)
                                </span>
                            </label>
                            <input
                                type="number"
                                id="product_ram"
                                value={data.product_ram}
                                onChange={(e) =>
                                    setData("product_ram", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.product_ram
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                placeholder="e.g. 8 (leave empty if not applicable)"
                                min={0}
                            />
                            <InputError
                                message={errors.product_ram}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Product Status
                        </label>
                        <label className="inline-flex items-center">
                            <input
                                type="checkbox"
                                checked={data.product_status}
                                onChange={(e) =>
                                    setData("product_status", e.target.checked)
                                }
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 dark:bg-gray-800 dark:border-gray-600"
                            />
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                                Product is in stock
                            </span>
                        </label>
                        <InputError
                            message={errors.product_status}
                            className="mt-2 text-sm text-red-500 dark:text-red-400"
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Product Images
                        </label>
                        <div className="relative">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                                {imagePreviews.map((preview, index) => {
                                    const isExistingImage =
                                        index < (datas?.images?.length || 0);
                                    return (
                                        <div
                                            key={`${preview}-${index}`}
                                            className="relative group"
                                        >
                                            <div className="w-full aspect-square border rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                <img
                                                    src={preview}
                                                    alt={`Product preview ${
                                                        imagePreviews.indexOf(
                                                            preview
                                                        ) + 1
                                                    }`}
                                                    className="w-full h-full object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeImage(index)
                                                    }
                                                    className="absolute top-2 right-2 bg-red-500 bg-opacity-80 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-100"
                                                    title="Remove image"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-4 w-4"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="w-full aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center hover:border-gray-400 dark:hover:border-gray-500 transition duration-150">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleImageChange}
                                        accept="image/*"
                                        className="hidden"
                                        id="image-upload"
                                        disabled={processing}
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className={`cursor-pointer text-center p-4 ${
                                            processing ? "opacity-50" : ""
                                        }`}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                        <span className="block mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            Add Images
                                        </span>
                                    </label>
                                </div>
                            </div>
                            <InputError
                                message={errors.images}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    {/* Actions section */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 rounded-xl flex justify-between items-center shadow-inner">
                        <Transition
                            show={recentlySuccessful}
                            enter="transition-opacity duration-200"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity duration-200"
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
                                    ? "Product updated successfully"
                                    : "Product created successfully"}
                            </div>
                        </Transition>
                        <div className="flex space-x-4">
                            <Link
                                href={route("products.index")}
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
                                                ? "Update Product"
                                                : "Create Product"}
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
