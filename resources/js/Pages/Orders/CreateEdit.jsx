import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useForm, usePage, router } from '@inertiajs/react';
import { useSelector, useDispatch } from "react-redux";
import AdminLayout from '@/Layouts/AdminLayout';
import { FiSave, FiX, FiMinus } from 'react-icons/fi';
import { FaSearch } from 'react-icons/fa';
import { IoAddSharp } from 'react-icons/io5';
import { AiOutlineShoppingCart } from "react-icons/ai";
import { BsCartCheck } from "react-icons/bs";
import { persistor } from '../store/index';
import axios from "axios";
import Swal from "sweetalert2";
import { addItem, decreaseItem, clearOrder } from "../store/orderSlice";
import { useTranslation } from 'react-i18next';

export default function CreateEdit() {
    // Display Product
    const { order = {}, products = [], categories = [], colors = [], auth, filters = {} } = usePage().props;

    // Select Color
    const [selectedColor, setSelectedColor] = useState(filters.color_id || 'all');

    // Display Invoice
    const { invoice_id } = usePage().props;
    const isEdit = Boolean(order && order.order_id);
    const exchangeRate = 4000;

    // Search Product
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearchTerm =
                product.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.product_id.toString().includes(searchTerm);

            const matchesColor = selectedColor === 'all' || product.color_id == selectedColor;

            return matchesSearchTerm && matchesColor;
        });
    }, [searchTerm, products, selectedColor]);

    // Handle Change Color when search product
    const handleColorChange = (e) => {
        setSelectedColor(e.target.value);
    };

    // For Category Selected
    const handleCategorySelect = (categoryId) => setActiveCategory(categoryId);
    const [activeCategory, setActiveCategory] = useState('all');
    const filteredCategoryProducts = useMemo(() => {
        if (activeCategory === 'all') return filteredProducts;
        return filteredProducts.filter((product) => product.category_id === activeCategory);
    }, [filteredProducts, activeCategory]);

    // Cart state
    const items = useSelector((state) => state.order.items);
    const dispatch = useDispatch();
    // Customer info
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    // Discount/subtotal/total
    const [discount, setDiscount] = useState(0);

    // Payment and currency
    const [selectedPayment, setSelectedPayment] = useState(order?.is_paid ? 'Cash' : 'Cash');

    // KHQR state
    const [qrUrl, setQrUrl] = useState(null);
    const [qrMd5, setQrMd5] = useState(null);
    const [qrPaid, setQrPaid] = useState(false);
    const [paymentDetected, setPaymentDetected] = useState(false);
    const pollIntervalRef = useRef(null);

    // Order state
    const [orderCreating, setOrderCreating] = useState(false);

    // Display Success pop up
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    // Translation && Bakong image
    const { t } = useTranslation();
    const bakong = '/images/bakong.png';

    // Calculate subtotal, total
    const getSubtotal = () => items.reduce((sum, item) => sum + item.quantity * item.product_price, 0);
    const getTotal = () => Math.max(getSubtotal() - Number(discount), 0);

    // Add product to cart
    const handleAddItem = (product) => {
        if (product.product_stock <= 0) return;
        dispatch(
            addItem({
                product_id: product.product_id,
                product_title: product.product_title,
                product_price: product.product_price,
                product_ram: product.product_ram,
                product_image: product.images.length > 0 ? product.images[0].image_path : null,
                id: product.product_id,
            })
        );
    };

    // Remove product from cart
    const handleDecreaseItem = (productId) => {
        dispatch(decreaseItem(productId));
    };

    // Discount change handler
    function handleDiscountChange(e) {
        setData('discount', e.target.value);
    }

    // Payment method select
    const handlePaymentSelect = (method) => {
        setSelectedPayment(method);
        setQrUrl(null);
        setQrMd5(null);
        setPaymentDetected(false);
    };

    // Currency select
    const handleCurrencySelect = (currency) => {
        setSelectedCurrency(currency);
    };

    // Select Currency
    const [selectedCurrency, setSelectedCurrency] = useState(() => {
        if (order?.currency === 'KHR') return 'Riel';
        return 'Dollar';
    });

    useEffect(() => {
        setData('currency', selectedCurrency === 'Riel' ? 'KHR' : 'USD');
    }, [selectedCurrency]);

    // Form state using Inertia useForm
    const { data, setData, post, patch, processing, errors, recentlySuccessful, reset } = useForm({
        customer_name: order?.customer?.name || '',
        customer_phone: order?.customer?.phone || '',
        sub_total: order?.sub_total || 0,
        discount: order?.discount || 0,
        total: order?.total || 0,
        total_payment: order?.total_payment || 0,
        user_id: order?.user_id || auth.user.id,
        is_paid: order?.is_paid || (selectedPayment === 'Cash'),
        payment_method: order?.payment_method || selectedPayment,
        items: items,
        currency: selectedCurrency === 'Riel' ? 'KHR' : 'USD',
    });

    // Generate KHQR when "Pay" is clicked and E-Wallet is selected
    const handlePayClick = async () => {
        if (selectedPayment !== "E-Wallet" || items.length === 0 || !customerName || !customerPhone) {
            Swal.fire('Please fill all info and select E-Wallet');
            return;
        }

        const payload = {
            amount: getTotal(),
            user_id: auth.user.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            currency: selectedCurrency === "Riel" ? "KHR" : "USD",
        };
        try {
            const res = await axios.post("/qr/generate", payload);
            setQrMd5(res.data.md5);
            setQrPaid(false);
            setQrUrl(res.data.qr_url);
        } catch (err) {
            // Handle error (show alert, etc.)
        }
    };

    // Poll for payment status (Problem because of this)
    // useEffect(() => {
    //     if (selectedPayment === "E-Wallet" && qrMd5) {
    //         pollIntervalRef.current = setInterval(async () => {
    //             try {
    //                 const res = await axios.post("/bakong/check-status", { md5: qrMd5 });
    //                 if (res.data.status === true) {
    //                     setPaymentDetected(true);
    //                     clearInterval(pollIntervalRef.current);
    //                 }
    //             } catch (err) { }
    //         }, 3000);
    //         return () => clearInterval(pollIntervalRef.current);
    //     }
    //     return () => clearInterval(pollIntervalRef.current);
    // }, [selectedPayment, qrMd5]);

    // Fix version: Poll for payment status to paid
    useEffect(() => {
        if (!qrMd5) return;
        // console.log("Hello QR");
        // console.log(qrMd5);
        const interval = setInterval(() => {
            axios.post("/api/bakong/check-status", { md5: qrMd5 })
                .then((res) => {
                    if (res.data.paid === true) {
                        setPaymentDetected(true);
                        clearInterval(interval); // Stop polling
                    } else {
                        console.log("not yet paid");
                        console.log(res);
                    }
                })
                .catch((err) => {
                    console.error("Failed to check payment status", err.response?.data || err);
                });
        }, 3000); // Poll every 3 seconds

        // Clean up interval when component unmounts or md5 changes
        return () => clearInterval(interval);
    }, [qrMd5]);



    // If QR is already generated, update it when cart/discount/currency changes
    useEffect(() => {
        if (selectedPayment === "E-Wallet" && qrMd5) {
            const updateQR = async () => {
                try {
                    const res = await axios.post("/qr/update-amount", {
                        md5: qrMd5,
                        amount: getTotal(),
                        currency: selectedCurrency === "Riel" ? "KHR" : "USD",
                    });
                    setQrUrl(res.data.qr_url);
                    setQrMd5(res.data.md5);
                } catch (err) {
                    // Optionally handle error
                }
            };
            updateQR();
        }
    }, [items, discount, selectedCurrency]);

    // Clear QR only when payment method changes
    useEffect(() => {
        setQrUrl(null);
        setQrMd5(null);
        setPaymentDetected(false);
    }, [selectedPayment]);

    // Submit order
    const submitOrder = async () => {
        setOrderCreating(true);
        try {
            const payload = {
                customer_name: customerName,
                customer_phone: customerPhone,
                items: items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                })),
                sub_total: getSubtotal(),
                discount: Number(discount),
                total: getTotal(),
                total_payment: getTotal(),
                currency: selectedCurrency === "Riel" ? "KHR" : "USD",
                payment_method: selectedPayment,
                md5_hash: selectedPayment === "E-Wallet" ? qrMd5 : null,
                is_paid: selectedPayment === "E-Wallet" ? true : true,
                user_id: auth.user.id,
            };

            const response = await axios.post("/orders", payload);
            const { invoice_id, order_id } = response.data;
            dispatch(clearOrder());
            setQrMd5(null);
            setQrUrl(null);
            setPaymentDetected(false);
            setDiscount(0);
            Swal.fire({
                title: 'Success!',
                text: `Order ${order_id} has been saved successfully.`,
                icon: 'success',
                confirmButtonText: 'Go to Invoice',
                confirmButtonColor: '#22c55e',
            }).then(() => {
                router.visit(route('invoiceOrders.show', { id: invoice_id }));
            });
        } catch (err) {
            if (err.response && err.response.data && err.response.data.errors) {
                const errorMsg = Object.values(err.response.data.errors).join('\n');
                Swal.fire("Order failed: " + errorMsg);
            } else {
                Swal.fire("Order failed: " + err.message);
            }
        } finally {
            setOrderCreating(false);
        }
    };

    // Auto-submit order when paid
    useEffect(() => {
        if (paymentDetected && !orderCreating) {
            submitOrder();
        }
    }, [paymentDetected]);

    const title = isEdit ? `${t('orders.actions.edit')} ${t('menu.order')}` : `${t('menu.create')} ${t('menu.order')}`;

    return (
        <AdminLayout>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50 p-4 min-h-screen items-start">
                {/* Products Section - Left 2/3 */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 flex flex-col">
                    {/* Search and category filters */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div className="flex items-center gap-2">
                            {/* Jongban POS Logo */}
                            <img
                                src="/images/brand-logo/blue-logo.png"
                                alt="JB PHONE SHOP Logo"
                                className="h-14 w-30 object-contain"
                            />
                            <h3 className="text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                POS
                            </h3>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="relative w-full sm:w-80">
                                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-500" />
                                <input
                                    type="text"
                                    placeholder={t('products.searchPlaceholder')}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 rounded-full bg-white border border-indigo-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 transition-all duration-300 text-gray-800 placeholder-gray-400 shadow-sm hover:shadow-md focus:outline-none"
                                />
                            </div>

                            {/* Color dropdown */}
                            <select
                                value={selectedColor}
                                onChange={handleColorChange}
                                className="mt-2 sm:mt-0 px-8 py-3 rounded-full bg-blue-500 text-white border border-indigo-700 focus:ring-2 focus:ring-indigo-400 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-blue-700 focus:outline-none appearance-none"
                            >
                                <option value="all" className="text-gray-900 bg-white rounded-lg cursor-pointer">{t('products.allColors')}</option>
                                {colors.map(color => (
                                    <option key={color.color_id} value={color.color_id} className="text-gray-900 bg-white hover:bg-gray-100 cursor-pointer">
                                        {color.color_title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-8 mt-4">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => handleCategorySelect('all')}
                                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${activeCategory === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                📱 {t('orders.allPhone')}
                            </button>
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategorySelect(category.id)}
                                    className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${activeCategory === category.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                >
                                    {category.name === 'Smartphones' ? '📱 ' : category.name === 'Accessories' ? '🎧 ' : category.name === 'Tablets' ? '💻 ' : '📦 '} {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCategoryProducts.length === 0 ? (
                                <p className="col-span-full text-center text-gray-500 font-medium">{t('products.noProductsFound')}</p>
                            ) : (
                                filteredCategoryProducts.map(product => (
                                    <div
                                        key={product.product_id}
                                        className="bg-white mt-2 rounded-xl shadow-sm border border-gray-100 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col relative"
                                    >
                                        {/* Stock badge */}
                                        <div
                                            className={`absolute top-2 left-2 px-2 py-1 rounded-md text-xs font-semibold z-10 
                                                ${product.product_stock <= 5
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-indigo-600 text-white'
                                                }`}
                                        >
                                            Only {product.product_stock} left
                                        </div>

                                        {/* Image container */}
                                        <div className="relative w-full h-48 mb-4">
                                            {product.images && product.images.length > 0 ? (
                                                <img
                                                    src={`/storage/${product.images[0].image_path}`}
                                                    alt={product.product_title}
                                                    className="w-full h-full object-contain rounded-lg"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                                            {product.product_title}
                                        </h3>
                                        <p className="text-md text-gray-500 mb-1">{product.category?.name || 'No Category'}</p>
                                        <p className="text-md text-gray-600">{product.product_ram} GB</p>
                                        <p className="text-md text-gray-500">
                                            {product.color ? (
                                                <span>{product.color.color_title}</span>
                                            ) : (
                                                <span>No Color</span>
                                            )}
                                        </p>

                                        <div className="flex justify-between items-center mt-auto">
                                            <span className="text-lg font-bold text-gray-800">${product.product_price}</span>
                                            <button
                                                onClick={() => handleAddItem(product)}
                                                disabled={product.product_stock <= 0}
                                                className={`p-2 rounded-full focus:outline-none focus:ring-2 transition-all duration-200
                                                    ${product.product_stock <= 0
                                                        ? 'bg-gray-300 text-gray-400 cursor-not-allowed'
                                                        : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-300'
                                                    }`}
                                            >
                                                <IoAddSharp size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Cart Section - Right 1/3 */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <AiOutlineShoppingCart className="text-3xl text-blue-600" />
                        <h3 className="text-2xl font-bold text-gray-800 mt-2">{t('orders.shoppingCart')}</h3>
                    </div>

                    {/* Product Card */}
                    {items.length === 0 ? (
                        <div className="flex items-center justify-center bg-gray-100 rounded-xl p-6 mb-6">
                            <BsCartCheck className="text-3xl text-gray-400 mr-3" />
                            <p className="text-lg text-gray-500 font-medium mt-3">Cart is empty</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.product_id} className="flex items-center justify-between bg-blue-50 rounded-xl p-4 mb-4">
                                <div className="flex items-center gap-4">
                                    <img
                                        src={item.product_image ? `/storage/${item.product_image}` : '/images/no-image.png'}
                                        alt={item.product_title}
                                        className="w-14 h-14 object-contain rounded"
                                    />
                                    <div>
                                        <div className="font-semibold text-base">{item.product_title}</div>
                                        <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-blue-600">${(item.product_price * item.quantity).toFixed(2)}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleDecreaseItem(item.product_id)}
                                        className="bg-red-500 text-white rounded-full p-2 hover:bg-red-200 transition"
                                        title="Remove"
                                    >
                                        <FiMinus size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Customer Info Inputs */}
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                <span className="text-red-500">*</span> Customer
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-xl border px-4 py-3 bg-gray-50"
                                placeholder="Enter customer name..."
                                value={customerName}
                                onChange={e => {
                                    setCustomerName(e.target.value);
                                    setData('customer_name', e.target.value);
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                <span className="text-red-500">*</span> Phone Number
                            </label>
                            <input
                                type="text"
                                className="w-full rounded-xl border px-4 py-3 bg-gray-50"
                                placeholder="Enter phone number..."
                                value={customerPhone}
                                onChange={e => {
                                    setCustomerPhone(e.target.value);
                                    setData('customer_phone', e.target.value);
                                }}
                            />
                        </div>
                    </div>

                    {/* Discount Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Discount (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full rounded-xl border px-4 py-3 bg-gray-50"
                            value={discount}
                            onChange={e => setDiscount(e.target.value)}
                        />
                    </div>

                    {/* Payment Method */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                className={`flex-1 py-3 rounded-xl font-semibold border transition-all duration-200 flex items-center justify-center gap-2 ${selectedPayment === 'Cash' ? 'bg-green-500 text-white border-green-600 shadow-lg' : 'bg-white text-gray-700 border-gray-200 shadow-sm'}`}
                                onClick={() => handlePaymentSelect('Cash')}
                            >
                                <span>💵</span> Cash
                            </button>
                            <button
                                type="button"
                                className={`flex-1 py-3 rounded-xl font-semibold border transition-all duration-200 flex items-center justify-center gap-2 ${selectedPayment === 'E-Wallet' ? 'bg-blue-500 text-white border-blue-600 shadow-lg' : 'bg-white text-gray-700 border-gray-200 shadow-sm'}`}
                                onClick={() => handlePaymentSelect('E-Wallet')}
                            >
                                <img src={bakong} alt="Bakong" className="w-5 h-5" /> E-Wallet
                            </button>
                        </div>
                    </div>

                    {/* Currency Dropdown */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
                        <select
                            className="w-full rounded-xl border px-4 py-3 bg-gray-50"
                            value={selectedCurrency}
                            onChange={e => handleCurrencySelect(e.target.value)}
                        >
                            <option value="Dollar">Dollar (USD)</option>
                            <option value="Riel">Riel (KHR)</option>
                        </select>
                    </div>

                    {/* Display QR code */}
                    {selectedPayment === "E-Wallet" && qrUrl && (
                        <div className="flex flex-col items-center mt-6">
                            <img src={qrUrl} alt="KHQR Code" className="w-56 h-56 mb-4" />
                            <p className="text-green-600 font-bold">Scan to pay with Bakong/E-Wallet</p>
                        </div>
                    )}

                    {/* Green Total Card */}
                    <div className="mb-4">
                        <div className="rounded-xl p-4 text-center font-semibold text-green-700 bg-green-100">
                            Total in {selectedCurrency === "Dollar" ? "Dollar" : "Riel"}: {selectedCurrency === "Riel"
                                ? `${(getTotal() * 4000).toLocaleString()} ៛`
                                : `$${getTotal().toFixed(2)}`
                            }
                        </div>
                    </div>

                    {/* Blue Summary Card */}
                    <div className="mb-4">
                        <div className="rounded-xl p-4 bg-blue-50 space-y-3">
                            <div className="flex justify-between mb-2 text-gray-700">
                                <span>Customer</span>
                                <span>{customerName || "N/A"}</span>
                            </div>
                            <div className="flex justify-between mb-2 text-gray-700">
                                <span>Sub Total</span>
                                <span>{selectedCurrency === "Riel"
                                    ? `${(getSubtotal() * 4000).toLocaleString()} ៛`
                                    : `$${getSubtotal().toFixed(2)}`
                                }</span>
                            </div>
                            <div className="flex justify-between mb-2 text-gray-700">
                                <span>Discount</span>
                                <span>{discount}%</span>
                            </div>
                            <hr className="my-2 border-blue-200" />
                            <div className="flex justify-between text-lg font-bold text-blue-600">
                                <span>Total</span>
                                <span>{selectedCurrency === "Riel"
                                    ? `${(getTotal() * 4000).toLocaleString()} ៛`
                                    : `$${getTotal().toFixed(2)}`
                                }</span>
                            </div>
                        </div>
                    </div>

                    {/* Place Order Button */}
                    <div className="flex justify-end items-center space-x-4 mt-6">
                        <Link
                            href={route('orders.index')}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full flex items-center space-x-2 hover:bg-gray-200 transition-all duration-200"
                        >
                            <FiX /> <span>Cancel</span>
                        </Link>
                        {selectedPayment === "E-Wallet" ? (
                            <button
                                type="button"
                                disabled={processing || items.length === 0 || !data.customer_name || !data.customer_phone}
                                className="px-6 py-3 bg-blue-600 text-white rounded-full flex items-center space-x-2 hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handlePayClick}
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiSave />
                                        <span>Generate QR</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={processing || items.length === 0 || !data.customer_name || !data.customer_phone || orderCreating}
                                className="px-6 py-3 bg-blue-600 text-white rounded-full flex items-center space-x-2 hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={submitOrder}
                            >
                                <FiSave />
                                <span>
                                    {orderCreating ? "Placing..." : "Place Order"}
                                </span>
                                {orderCreating && (
                                    <svg className="animate-spin ml-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                    </svg>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout >
    );
}