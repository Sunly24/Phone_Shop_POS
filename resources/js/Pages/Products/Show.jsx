import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";

export default function Show() {
    const { product } = usePage().props;
    const [selectedImage, setSelectedImage] = useState(
        product.images && product.images.length > 0 ? product.images[0] : null
    );

    const headWeb = "Product Details";
    const crumbs = [
        { title: "Home", url: route("dashboard") },
        { title: "Products", url: route("products.index") },
        { title: headWeb, url: "" },
    ];

    return (
        <AdminLayout
            breadcrumb={<Breadcrumb header={headWeb} links={crumbs} />}
        >
            <Head title={headWeb} />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
                <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    {/* Main Product Card */}
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                        <div className="lg:flex">
                            {/* Left side - Image Gallery */}
                            <div className="lg:w-3/5 p-8">
                                {/* Main Image Container */}
                                <div className="relative group">
                                    <div className="aspect-square w-full max-w-lg mx-auto">
                                        {selectedImage ? (
                                            <div className="relative h-full rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner">
                                                <img
                                                    src={`/storage/${selectedImage.image_path}`}
                                                    alt={product.product_title}
                                                    className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-2xl shadow-inner">
                                                <div className="text-center">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-24 w-24 text-gray-400 mx-auto mb-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={1.5}
                                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                    <p className="text-gray-500 font-medium">
                                                        No image available
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Thumbnail Gallery */}
                                {product.images &&
                                    product.images.length > 0 && (
                                        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
                                            {product.images.map(
                                                (image, index) => (
                                                    <button
                                                        key={
                                                            image.product_image_id
                                                        }
                                                        onClick={() =>
                                                            setSelectedImage(
                                                                image
                                                            )
                                                        }
                                                        className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                                                            selectedImage?.product_image_id ===
                                                            image.product_image_id
                                                                ? "ring-3 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg transform scale-105"
                                                                : "ring-1 ring-gray-200 hover:ring-2 hover:ring-blue-300 hover:shadow-md"
                                                        }`}
                                                    >
                                                        <img
                                                            src={`/storage/${image.image_path}`}
                                                            alt={`${
                                                                product.product_title
                                                            } ${index + 1}`}
                                                            className="w-full h-full object-contain bg-gray-50 p-1"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    )}
                            </div>

                            {/* Right side - Product Details */}
                            <div className="lg:w-2/5 p-8 bg-gradient-to-br from-white to-slate-50/50">
                                {/* Header Section */}
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                                        <div>
                                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent leading-tight">
                                                {product.product_title}
                                            </h1>
                                            <p className="text-sm text-gray-500 font-medium mt-1">
                                                #{product.product_code}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Section */}
                                <div className="mb-8">
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                ${product.product_price}
                                            </span>
                                            <span className="text-gray-500 text-lg">
                                                USD
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Cards */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                                        <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                            Stock
                                        </h3>
                                        <span
                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
                                                product.product_stock > 0
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {product.product_stock} units
                                        </span>
                                    </div>

                                    <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
                                        <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                                            Status
                                        </h3>
                                        <span
                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
                                                product.product_stock > 0 &&
                                                product.product_status
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {product.product_stock > 0 &&
                                            product.product_status
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>
                                </div>

                                {/* Product Specifications */}
                                <div className="space-y-4 mb-8">
                                    {[
                                        {
                                            label: "Category",
                                            value: product.category?.name,
                                        },
                                        {
                                            label: "Brand",
                                            value: product.brand?.brand_title,
                                        },
                                        {
                                            label: "Maker",
                                            value: product.maker?.maker_title,
                                        },
                                        {
                                            label: "Size",
                                            value: product.size?.size_title,
                                        },
                                        {
                                            label: "Color",
                                            value: product.color?.color_title,
                                        },
                                        {
                                            label: "RAM",
                                            value: product.product_ram,
                                        },
                                    ]
                                        .filter((spec) => spec.value)
                                        .map((spec, index) => (
                                            <div
                                                key={`spec-${spec.label}-${index}`}
                                                className="flex items-center justify-between py-3 px-4 bg-white/60 rounded-xl border border-gray-100"
                                            >
                                                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                                                    {spec.label}
                                                </span>
                                                <span className="text-gray-900 font-medium">
                                                    {spec.value}
                                                </span>
                                            </div>
                                        ))}
                                </div>

                                {/* Description */}
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                                        Description
                                    </h3>
                                    <div className="bg-white/60 rounded-xl p-4 border border-gray-100">
                                        <p className="text-gray-700 leading-relaxed">
                                            {product.product_description ||
                                                "No description available"}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="pt-6 border-t border-gray-200">
                                    <Link
                                        href={route("products.index")}
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold text-center transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 flex items-center justify-center gap-2 group"
                                    >
                                        <svg
                                            className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                            />
                                        </svg>
                                        Back to Products
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
