import { useState, useEffect } from "react";
import axios from "axios";

export default function OrderHistory({ open, onClose }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            setLoading(true);
            axios.get("/order-history")
                .then(res => {
                    setOrders(res.data.orders);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-l-2xl shadow-2xl w-full max-w-md h-full p-0 relative flex flex-col overflow-hidden border-l border-gray-100/50 animate-slideInRight">
                {/* Header with glass effect */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-700 p-6 sticky top-0 z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Order History</h2>
                        <button
                            className="text-white/80 hover:text-white text-2xl transition-all duration-200 rounded-full p-1 hover:bg-white/10"
                            onClick={onClose}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content area */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                            <p className="mt-4 text-gray-500">Loading your orders...</p>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
                            <div className="bg-indigo-100/50 p-5 rounded-full mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-800">No orders yet</h3>
                            <p className="text-gray-500 mt-1 max-w-md">Your order history will appear here once you make purchases</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100/50">
                            {orders.map(order => (
                                <div key={order.order_id} className="p-6 hover:bg-blue-100 transition-colors duration-200 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-gray-900">#{order.order_id}</span>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${order.status === "Completed"
                                                ? "bg-green-100 text-green-800"
                                                : order.status === "Processing"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-gray-100 text-gray-800"
                                                }`}>
                                                {order.status || "Completed"}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    <div className="space-y-4 mb-4">
                                        {order.items.map(item => (
                                            <div key={item.order_item_id} className="flex gap-4 items-center">
                                                <div className="flex-shrink-0 relative">
                                                    <img
                                                        src={item.product_image ? `/product-images/${item.product_image}` : '/placeholder-product.jpg'}
                                                        alt={item.product_title}
                                                        onError={e => { e.target.src = '/placeholder-product.jpg'; }}
                                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200/30"
                                                    />
                                                    <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                                        {item.quantity}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 truncate">{item.product_title}</h4>
                                                    <div className="flex gap-3 mt-1">
                                                        {item.product_color && (
                                                            <span className="text-xs text-gray-500 flex items-center">
                                                                <span className="w-3 h-3 rounded-full mr-1 border border-gray-300" style={{ backgroundColor: item.product_color.toLowerCase() }} />
                                                                {item.product_color}
                                                            </span>
                                                        )}
                                                        {item.product_ram && (
                                                            <span className="text-xs text-gray-500">RAM: {item.product_ram}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">${item.product_price}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100/50">
                                        <div className="text-sm text-gray-500">
                                            {order.payment_method === "khqr" ? (
                                                <span className="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Paid with KHQR
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                                    </svg>
                                                    Paid with Cash
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">Total</p>
                                            <p className="font-bold text-lg text-gray-900">${order.total_payment ? Number(order.total_payment).toFixed(2) : "0.00"}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer with subtle gradient */}
                <div className="bg-gradient-to-t from-white via-white to-white/80 p-4 sticky bottom-0 border-t border-gray-100/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}