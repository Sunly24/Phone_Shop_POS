import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { AiOutlineDelete, AiOutlineShoppingCart } from "react-icons/ai";
import { motion } from "framer-motion";
import axios from "axios";
import { removeItem } from "@/Pages/store/orderSlice";
import Swal from "sweetalert2";

const currencies = [
  { code: "USD", label: "Dollar (USD)", symbol: "$" },
  { code: "KHR", label: "Riel (KHR)", symbol: "៛" },
];

export default function OrderReview({ onClose, user }) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.order.items);
  const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.product_price, 0);
  const discount = 0;
  const total = subtotal - discount;

  // currency state
  const [currency, setCurrency] = useState(currencies[0].code);
  const selectedCurrency = currencies.find((c) => c.code === currency);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState("Cash");

  // QR code
  const [qrUrl, setQrUrl] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [qrMd5, setQrMd5] = useState(null);

  // Customer info (for guest)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Order loading state
  const [orderLoading, setOrderLoading] = useState(false);

  // Bill number for QR and payment event matching
  const [billNumber, setBillNumber] = useState(null);

  const isLoggedIn = !!user;

  // Prevent multiple auto-submits
  const hasSubmittedRef = useRef(false);

  // Polling interval ref
  const pollIntervalRef = useRef(null);

  // Generate QR when E-Wallet is selected or currency/total changes
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (paymentMethod === "E-Wallet") {
      setQrUrl(null);
      setQrError(null);
      if (total > 0) {
        generateQr().then((qrData) => {
          if (qrData?.md5) {
            pollIntervalRef.current = setInterval(async () => {
              try {
                const res = await axios.post("/api/user/qr/check", { md5: qrData.md5 });
                if (res.data.status === "PAID" && !hasSubmittedRef.current) {
                  hasSubmittedRef.current = true;
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                  // Show success popup and clear cart
                  Swal.fire({
                    title: "Order Success!",
                    text: "Order has been placed successfully.",
                    icon: "success",
                    confirmButtonText: "OK",
                    confirmButtonColor: "#22c55e",
                  }).then(() => {
                    dispatch({ type: "order/clearOrder" });
                    if (onClose) onClose();
                  });
                }
              } catch (e) {
                // Optionally handle error
              }
            }, 3000);
          }
        });
      }
    } else {
      setQrUrl(null);
      setQrError(null);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [paymentMethod, currency, total]);

  // Generate QR function
  const generateQr = async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const bill_number = `WEB-${Date.now()}`;
      setBillNumber(bill_number);
      const res = await axios.post("/api/user/qr/generate", {
        amount: total,
        currency,
        bill_number,
      });
      if (isLoggedIn && user?.id) {
        qrPayload.user_id = user.id;
      }
      setQrUrl(res.data.qr_url);
      setQrMd5(res.data.md5);
      return res.data;
    } catch (err) {
      setQrError("Failed to generate QR code.");
    } finally {
      setQrLoading(false);
    }
  };

  // Place Order handler
  const handlePlaceOrder = async () => {
    if (orderLoading) return;
    setOrderLoading(true);
    await submitOrder();
  };

  // Submit order to backend
  const submitOrder = async () => {
    try {
      const payload = {
        items: cartItems,
        total,
        currency,
        payment_method: paymentMethod,
        bill_number: billNumber,
        is_paid: true,
        md5_hash: qrMd5,
      };

      // If E-Wallet, include QR details
      if (paymentMethod === "E-Wallet") {
        payload.md5_hash = qrMd5;
      }

      if (isLoggedIn && user?.id) {
        payload.user_id = user.id;
      }

      if (!isLoggedIn) {
        payload.customer_name = customerName;
        payload.customer_phone = customerPhone;
      }

      await axios.post("/public-orders", payload);
      Swal.fire({
        title: "Order Success!",
        text: "Order has been placed successfully.",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#22c55e",
      }).then(() => {
        dispatch({ type: "order/clearOrder" });
        if (onClose) onClose();
      });
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: "Failed to place order. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setOrderLoading(false);
      hasSubmittedRef.current = false;
    }
  };

  useEffect(() => {
    const handler = (e) => {
      const data = e.detail;
      if (
        data.status === "PAID" &&
        data.bill_number === billNumber && // Make sure billNumber is in scope
        !hasSubmittedRef.current
      ) {
        hasSubmittedRef.current = true;
        Swal.fire({
          title: "Order Success!",
          text: "Order has been placed successfully.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#22c55e",
        }).then(() => {
          dispatch({ type: "order/clearOrder" });
          if (onClose) onClose();
        });
      }
    };
    window.addEventListener("bakong-payment-completed", handler);
    return () => window.removeEventListener("bakong-payment-completed", handler);
  }, [billNumber, onClose, dispatch]);

  // Listen for Bakong payment event and auto-submit order
  useEffect(() => {
    if (paymentMethod !== "E-Wallet" || !billNumber) return;

    const handleBakongPayment = (e) => {
      if (
        e.detail?.status === "PAID" &&
        e.detail?.bill_number === billNumber &&
        !hasSubmittedRef.current
      ) {
        hasSubmittedRef.current = true;
        Swal.fire({
          title: "Order Success!",
          text: "Order has been placed successfully.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#22c55e",
        }).then(() => {
          dispatch({ type: "order/clearOrder" });
          if (onClose) onClose();
        });
      }
    };

    window.addEventListener("bakong-payment-completed", handleBakongPayment);

    return () => {
      window.removeEventListener("bakong-payment-completed", handleBakongPayment);
    };
    // eslint-disable-next-line
  }, [paymentMethod, billNumber, cartItems, currency, total]);

  // Handle remove
  const handleRemove = (productId) => {
    dispatch(removeItem(productId));
  };

  const bakong = '/images/bakong.png';

  return (
    <div className="h-full w-full max-w-md bg-white shadow-xl flex flex-col relative">

      {/* Header */}
      <div className="flex items-center gap-2 pt-6 pb-2 px-6 border-b">
        <AiOutlineShoppingCart className="text-3xl text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">Order Review</h2>
        <button onClick={onClose} className="ml-auto text-gray-500 hover:text-red-500">✕</button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {/* Cart Items */}
        <div className="p-4">
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
                  className="flex items-start justify-between bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
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
                      <h3 className="text-lg text-gray-800 font-semibold">{item.product_title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {item.color && (
                          <>
                            <span
                              className="inline-block w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: item.color.hex || item.color }}
                              title={item.color.color_title || item.color}
                            ></span>
                            <span className="text-gray-500 text-sm">
                              {item.color.color_title || item.color}
                            </span>
                          </>
                        )}
                        <span className="text-indigo-600 font-semibold ml-2">
                          {selectedCurrency.symbol}
                          {Number(item.product_price).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.product_id)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-gray-100 rounded-full transition"
                  >
                    <AiOutlineDelete className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Payment Method */}
        <div className="mb-4 px-4">
          <label className="block font-semibold mb-2">Payment Method</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('Cash')}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border-2 font-semibold text-base transition-all duration-200
            ${paymentMethod === 'Cash'
                  ? 'bg-green-500 text-white border-green-500 shadow'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-green-50'
                }`}
            >
              <span className="text-lg">💵</span> Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('E-Wallet')}
              className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-lg border-2 font-semibold text-base transition-all duration-200
            ${paymentMethod === 'E-Wallet'
                  ? 'bg-blue-50 text-blue-600 border-blue-500 shadow'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'
                }`}
            >
              <img
                src={bakong}
                alt="Bakong"
                className="w-5 h-5"
              /> E-Wallet
            </button>
          </div>
        </div>

        {/* Inline QR Section */}
        {paymentMethod === "E-Wallet" && (
          <div className="flex flex-col items-center px-4 mb-4">
            {qrError && (
              <div className="text-red-500 mb-2">{qrError}</div>
            )}
            {qrLoading ? (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg mb-2">
                <span className="animate-spin text-2xl text-blue-500">⏳</span>
              </div>
            ) : qrUrl ? (
              <>
                <div className="text-yellow-700 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 text-center mb-2 w-full">
                  <span role="img" aria-label="hourglass">⏳</span> QR Code ready - Waiting for payment...
                </div>
                <img src={qrUrl} alt="KHQR" className="w-48 h-48 object-contain mb-2 shadow" />
                <div className="text-center text-gray-500 mb-1">
                  Pay <span className="text-blue-600 font-semibold">{selectedCurrency.symbol}{total.toFixed(2)}</span> with E-Wallet
                </div>
                <div className="text-center text-gray-400 text-sm">
                  Please scan with your Bakong or E-Wallet app.
                </div>
              </>
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-lg mb-2">
                <span className="text-gray-400">No QR</span>
              </div>
            )}
          </div>
        )}

        {/* Currency Selection */}
        <div className="mb-4 px-4">
          <label className="block font-semibold mb-2">Currency</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Total in selected currency */}
        <div className="mb-4 px-4">
          <div className="bg-green-100 text-green-800 rounded-lg px-4 py-3 text-center font-semibold">
            Total in {selectedCurrency.label}: {selectedCurrency.symbol}
            {total.toFixed(2)}
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="px-4 pb-2">
          <div className="bg-blue-50 rounded-xl p-5 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Sub Total</span>
              <span className="text-gray-800 font-medium">
                {selectedCurrency.symbol}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Tax</span>
              <span className="text-green-600 font-medium">0%</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200 mt-3">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg text-blue-600">
                {selectedCurrency.symbol}
                {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Place Order button always visible at the bottom */}
      <div className="p-4 border-t">
        {paymentMethod === "Cash" ? (
          <button
            onClick={handlePlaceOrder}
            className="w-full bg-blue-500 shadow-sm text-white py-2 rounded hover:bg-blue-600 hover:shadow-lg"
            disabled={orderLoading}
          >
            {orderLoading ? "Placing Order..." : "Place Order"}
          </button>
        ) : (
          <button
            className="w-full bg-blue-500 text-white py-2 rounded opacity-70 cursor-not-allowed"
            disabled
          >
            Waiting for Payment...
          </button>
        )}
      </div>
    </div>
  );
}