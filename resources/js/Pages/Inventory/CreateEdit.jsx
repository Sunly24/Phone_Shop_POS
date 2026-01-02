import React, { useState, useEffect } from "react";
import { usePage, Link, router } from "@inertiajs/react";
import { Transition } from '@headlessui/react';
import { FiSave, FiX, FiPlusCircle, FiEdit2 } from "react-icons/fi";
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import InputError from "@/Components/InputError";

export default function InventoryCreateEdit() {
    const { inventory = {}, products = [], errors = {}, recentlySuccessful = false } = usePage().props;
    const isEdit = Boolean(inventory.id);

    const [formData, setFormData] = useState({
        product_id: inventory.product?.product_id || "",
        product_title: inventory.product?.product_title || "",
        product_price: inventory.product?.product_price || 0,
        product_stock: inventory.product?.product_stock || 0,
        quantity_booked: inventory.quantity_booked || 0,
    });

    const [processing, setProcessing] = useState(false);

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        if (isEdit) {
            router.put(route("inventory.update", inventory.id), formData, {
                onFinish: () => setProcessing(false),
                preserveState: true
            });
        } else {
            router.post(route("inventory.store"), formData, {
                onFinish: () => setProcessing(false),
                preserveState: true
            });
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'product_id' ? value :
                (name === 'quantity_booked' || name === 'product_price' || name === 'product_stock') ?
                    Number(value) : value
        }));

        // If product_id changes, update other fields from the selected product
        if (name === 'product_id' && value) {
            const selectedProduct = products.find(p => p.product_id == value);
            if (selectedProduct) {
                setFormData(prev => ({
                    ...prev,
                    product_title: selectedProduct.product_title,
                    product_price: selectedProduct.product_price,
                    product_stock: selectedProduct.product_stock,
                    quantity_booked: selectedProduct.quantity_booked ?? 0,
                }));
            }
        }
    };

    // Title and breadcrumbs
    const title = isEdit ? 'Edit Inventory' : 'Create New Inventory';
    const crumbs = [
        { title: 'Home', url: route("dashboard") },
        { title: 'Inventory', url: route("inventory.index") },
        { title, url: '' },
    ];

    return (
        <AdminLayout breadcrumb={<Breadcrumb header={title} links={crumbs} />}>
            <div className="w-full h-screen bg-white dark:bg-gray-900 shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-200">
                {/* Top border accent with gradient */}
                <div className={`h-2 ${isEdit ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`} />

                {/* Header section */}
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${isEdit ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-blue-100 dark:bg-blue-900/20'} transform hover:scale-110 transition-all duration-200`}>
                        {isEdit ? (
                            <FiEdit2 className="w-7 h-7 text-yellow-500 dark:text-yellow-400" />
                        ) : (
                            <FiPlusCircle className="w-7 h-7 text-blue-500 dark:text-blue-400" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">{title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isEdit ? 'Update existing inventory details below' : 'Add new inventory to the system'}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 px-8 py-8 space-y-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Product Selection */}
                        <div>
                            <label htmlFor="product_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Product <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="product_id"
                                    name="product_id"
                                    value={formData.product_id}
                                    onChange={handleChange}
                                    className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                        focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                        ${errors.product_id ? 'border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30' : ''}
                                        transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                    required
                                >
                                    <option value="">Select a product</option>
                                    {products.map((product) => (
                                        <option key={product.product_id} value={product.product_id}>
                                            {product.product_title}
                                        </option>
                                    ))}
                                </select>
                                {errors.product_id && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <InputError message={errors.product_id} className="mt-2 text-sm text-red-500 dark:text-red-400" />
                        </div>

                        {/* Product Title */}
                        <div>
                            <label htmlFor="product_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Product Title
                            </label>
                            <input
                                type="text"
                                id="product_title"
                                name="product_title"
                                value={formData.product_title}
                                onChange={handleChange}
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                            />
                        </div>

                        {/* Product Price */}
                        <div>
                            <label htmlFor="product_price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Product Price
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 dark:text-gray-400">$</span>
                                </div>
                                <input
                                    type="number"
                                    id="product_price"
                                    name="product_price"
                                    value={formData.product_price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100 pl-8
                                        focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                        transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                />
                            </div>
                        </div>

                        {/* Product Stock */}
                        <div>
                            <label htmlFor="product_stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Current Stock
                            </label>
                            <input
                                type="number"
                                id="product_stock"
                                name="product_stock"
                                value={formData.product_stock}
                                onChange={handleChange}
                                min="0"
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                            />
                        </div>

                        {/* Quantity Booked */}
                        <div>
                            <label htmlFor="quantity_booked" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Quantity Booked <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    id="quantity_booked"
                                    name="quantity_booked"
                                    value={formData.quantity_booked}
                                    onChange={handleChange}
                                    min="0"
                                    className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                        text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                        focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                        ${errors.quantity_booked ? 'border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30' : ''}
                                        transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                    required
                                />
                                {errors.quantity_booked && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <InputError message={errors.quantity_booked} className="mt-2 text-sm text-red-500 dark:text-red-400" />
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
                                <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {isEdit ? 'Inventory updated successfully' : 'Inventory created successfully'}
                            </div>
                        </Transition>
                        <div className="flex space-x-4">
                            <Link
                                href={route("inventory.index")}
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
                                    ${isEdit
                                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:ring-yellow-400 text-white'
                                        : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:ring-blue-400 text-white'}
                                    disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {isEdit ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-5 h-5" />
                                        <span>{isEdit ? 'Update Inventory' : 'Create Inventory'}</span>
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