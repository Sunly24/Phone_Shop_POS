import { useSelector, useDispatch } from "react-redux";
import { decreaseItem, addItem, removeItem } from "@/Pages/store/orderSlice";
import { AiOutlineMinus, AiOutlineClose, AiOutlinePlus, AiOutlineDelete } from "react-icons/ai";
import { FiShoppingCart } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import OrderReview from "./OrderReview";

export default function CartDrawer({ open, onClose }) {
    const cartItems = useSelector(state => state.order.items);
    const [showOrderReview, setShowOrderReview] = useState(false);
    const dispatch = useDispatch();

    const handleIncrease = (item) => {
        dispatch(addItem({
            product_id: item.product_id,
            product_title: item.product_title,
            product_price: item.product_price,
            images: item.images,
        }));
    };

    const handleDecrease = (productId) => {
        dispatch(decreaseItem(productId));
    };

    const handleRemove = (productId) => {
        dispatch(removeItem(productId));
    };

    const cartCount = useSelector(state =>
        state.order.items.reduce((sum, item) => sum + item.quantity, 0)
    );

    const subtotal = cartItems.reduce(
        (sum, item) => sum + (item.product_price * item.quantity),
        0
    );

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[100] overflow-hidden">
                    {/* Overlay with animation */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer with slide animation */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', ease: 'easeInOut' }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <img
                                    src="/images/brand-logo/blue-logo.png"
                                    alt="JB PHONE SHOP Logo"
                                    className="h-8 w-16 object-contain flex-shrink-0"
                                />
                                <div className="flex items-center gap-2 min-w-0">
                                    <h2 className="text-lg font-bold text-gray-800 whitespace-nowrap">Your Cart</h2>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition flex-shrink-0"
                            >
                                <AiOutlineClose className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            {cartItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <FiShoppingCart className="w-16 h-16 mb-4 text-gray-200" />
                                    <h3 className="text-lg font-medium text-gray-500 mb-1">Your cart is empty</h3>
                                    <p className="text-sm text-gray-400">Start adding some products</p>
                                </div>
                            ) : (
                                <motion.div layout className="space-y-4">
                                    {cartItems.map(item => (
                                        <motion.div
                                            layout
                                            key={item.product_id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 50 }}
                                            className="flex items-start justify-between bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-all duration-200"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="relative">
                                                    <img
                                                        src={item.images?.[0]?.image_path ? `/storage/${item.images[0].image_path}` : "/images/no-image.png"}
                                                        alt={item.product_title}
                                                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                    />
                                                    {item.quantity > 1 && (
                                                        <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                                            {item.quantity}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className="text-lg text-gray-800 line-clamp-2">{item.product_title}</h3>
                                                    <p className="text-indigo-600 font-semibold mt-1">
                                                        ${Number(item.product_price).toFixed(2)}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-3">
                                                        <button
                                                            onClick={() => handleDecrease(item.product_id)}
                                                            className={`flex items-center justify-center w-8 h-8 rounded-full ${item.quantity <= 1
                                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                : "bg-gray-100 hover:bg-indigo-100 text-indigo-600"
                                                                } transition`}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <AiOutlineMinus className="w-4 h-4" />
                                                        </button>
                                                        <span className="text-sm font-medium w-6 text-center">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => handleIncrease(item)}
                                                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-indigo-100 text-indigo-600 transition"
                                                        >
                                                            <AiOutlinePlus className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.product_id)}
                                                className="p-1 text-red-400 hover:text-red-600 hover:bg-gray-100 rounded-full p-1 transition"
                                            >
                                                <AiOutlineDelete className="w-5 h-5" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {/* Checkout Footer */}
                        {cartItems.length > 0 && (
                            <div className="border-t border-gray-100 p-6 bg-white">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-bold text-gray-900 text-lg">${subtotal.toFixed(2)}</span>
                                </div>
                                <button
                                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
                                    onClick={() => {
                                        setShowOrderReview(true);
                                    }}
                                >
                                    Checkout Now
                                </button>
                                <p className="text-center text-xs text-gray-500 mt-3">
                                    Free shipping on orders over $50
                                </p>
                            </div>
                        )}
                        <AnimatePresence>
                            {showOrderReview && (
                                <>
                                    {/* full-screen backdrop */}
                                    <motion.div
                                        className="fixed inset-0 "
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setShowOrderReview(false)}
                                    />

                                    {/* right-side drawer */}
                                    <motion.div
                                        className="fixed top-0 right-0 h-full w-full max-w-md z-100"
                                        initial={{ x: "100%" }}
                                        animate={{ x: 0 }}
                                        exit={{ x: "100%" }}
                                        transition={{ type: "tween", ease: "easeInOut" }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <OrderReview onClose={() => setShowOrderReview(false)} />
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}