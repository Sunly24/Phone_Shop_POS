import React, { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import { Link } from '@inertiajs/react';
import AdminLayout from "@/Layouts/AdminLayout";
import Breadcrumb from "@/Components/Breadcrumb";
import { FaArrowLeft } from "react-icons/fa";
import { MdHistory } from "react-icons/md";

export default function InvoiceShow() {
  const { invoice, invoice_id, auth } = usePage().props; // Extracting auth from usePage()
  const isAdmin = auth?.user?.roles?.some(role => role.name.toLowerCase() === 'admin'); // Checking admin role

  useEffect(() => {
    if (invoice) {
    }
  }, [invoice, invoice_id]);

  if (!invoice) {
    return (
      <div className="text-center py-6">
        <h2 className="text-xl text-gray-700">Invoice not found</h2>
      </div>
    );
  }

  const headWeb = "Invoice Details";
  const head = `Invoice ${invoice.invoice_id}`;
  // const crumbs = [
  //   { title: "Home", url: route("dashboard") },
  //   { title: "Invoices", url: route("invoices.index") },
  //   { title: headWeb, url: "" },
  // ];

  return (
    <AdminLayout hideFooter>
      <div className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden mt-8 border border-gray-200">
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{head}</h1>
              <p className="text-blue-100 mt-1">
                {new Date(invoice.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${invoice.is_paid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
            >
              {invoice.is_paid ? "PAID" : "PENDING"}
            </span>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-8">
          {/* Company and Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">From</h2>
              <div className="space-y-2">
                <p className="font-medium">Phone Shop</p>
                <p>123 Business Street</p>
                <p>City, State 10001</p>
                <p>Phone: (123) 456-7890</p>
                <p>Email: info@phoneshop.com</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Bill To</h2>
              <div className="space-y-2">
                <p className="font-medium">{invoice.customer?.name || "Customer Name"}</p>
                <p>{invoice.customer?.email || "N/A"}</p>
                <p>{invoice.customer?.phone || "N/A"}</p>
                <p>{invoice.customer?.address || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse mb-8 table-fixed">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="py-3 px-4 font-semibold border-b w-1/2">Item</th>
                  <th className="py-3 px-4 font-semibold border-b w-1/6 text-right">Qty</th>
                  <th className="py-3 px-4 font-semibold border-b w-1/6 text-right">Color</th>
                  <th className="py-3 px-4 font-semibold border-b w-1/6 text-right">Memory Storage</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.order?.items || []).map(item => (
                  <tr key={item.order_item_id}>
                    <td className="py-2 px-4 border-b w-1/2">{item.product_title}</td>
                    <td className="py-2 px-4 border-b w-1/6 text-right">{item.quantity}</td>
                    <td className="py-2 px-4 border-b w-1/6 text-right">
                      {item.product_color || "N/A"}
                    </td>
                    <td className="py-2 px-4 border-b w-1/6 text-right">
                      {item.product_ram ? `${item.product_ram} GB` : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="ml-auto max-w-xs">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {invoice.order?.currency === 'KHR' 
                    ? `${Number(invoice.order?.sub_total || 0).toLocaleString()} ៛`
                    : `$${Number(invoice.order?.sub_total || 0).toFixed(2)}`
                  }
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium">{invoice.order?.discount ? `${invoice.order.discount}%` : "0%"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">
                  {invoice.order?.currency === 'KHR' ? '0 ៛' : '$0.00'}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-semibold">
                  {invoice.currency === 'KHR' || invoice.order?.currency === 'KHR'
                    ? `${Number(invoice.total_amount).toLocaleString()} ៛`
                    : `$${Number(invoice.total_amount).toFixed(2)}`
                  }
                </span>
              </div>
              <div className="flex justify-between py-2 border-t mt-2">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium text-green-600">
                  {invoice.is_paid ? (
                    invoice.currency === 'KHR' || invoice.order?.currency === 'KHR'
                      ? `${Number(invoice.paid_amount || invoice.total_amount).toLocaleString()} ៛`
                      : `$${Number(invoice.paid_amount || invoice.total_amount).toFixed(2)}`
                  ) : (
                    invoice.currency === 'KHR' || invoice.order?.currency === 'KHR' ? '0 ៛' : '$0.00'
                  )}
                </span>
              </div>
              {!invoice.is_paid && (
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Balance Due:</span>
                  <span className="font-medium text-red-600">
                    {invoice.currency === 'KHR' || invoice.order?.currency === 'KHR'
                      ? `${(Number(invoice.total_amount) - Number(invoice.paid_amount || 0)).toLocaleString()} ៛`
                      : `$${(Number(invoice.total_amount) - Number(invoice.paid_amount || 0)).toFixed(2)}`
                    }
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Notes */}
          <div className="mt-12 pt-4 border-t text-sm text-gray-500">
            <p className="mb-2">Thank you for your business!</p>
            <p>Please make payments within 15 days of receiving this invoice.</p>
            <p>For questions, contact us at support@phoneshop.com</p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between">
            {/* Back Button */}
            {isAdmin ? (
              <Link
                href={route('invoices.index')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaArrowLeft className="mr-2 h-4 w-4" />
                Back to Invoice
              </Link>
            ) : (
              <Link
                href={route('orders.create')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaArrowLeft className="mr-2 h-4 w-4" />
                Back to Order
              </Link>
            )}
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
