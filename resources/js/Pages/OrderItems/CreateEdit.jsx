// import React, { useEffect, useState, useMemo } from 'react'
// import { Head, Link, useForm, usePage } from '@inertiajs/react'
// import AdminLayout from '@/Layouts/AdminLayout'
// import Breadcrumb from '@/Components/Breadcrumb'
// import InputError from '@/Components/InputError'
// import { FiSave, FiX, FiTrash2 } from 'react-icons/fi'

// export default function CreateEdit() {
//   const { order, products, auth } = usePage().props
//   const isEdit = Boolean(order && order.order_id)

//   // Main order form
//   const { data, setData, post, patch, processing, errors, recentlySuccessful, reset } = useForm({
//     customer_name: order?.customer?.name || '',
//     sub_total: order?.sub_total || '',
//     discount: order?.discount || '',
//     total: order?.total || '',
//     total_payment: order?.total_payment || '',
//     user_id: order?.user_id || auth.user.id,
//   })

//   // Auto-recalc total & total_payment = sub_total − discount
//   useEffect(() => {
//     const st = parseFloat(data.sub_total) || 0
//     const disc = parseFloat(data.discount) || 0
//     const tot = Math.max(0, st - disc)
//     setData('total', tot.toFixed(2))
//     setData('total_payment', tot.toFixed(2))
//   }, [data.sub_total, data.discount])

//   function submitOrder(e) {
//     e.preventDefault()
//     if (isEdit) {
//       patch(route('orders.update', order.order_id), { preserveState: true, onFinish: () => reset() })
//     } else {
//       post(route('orders.store'), { preserveState: true, onFinish: () => reset() })
//     }
//   }

//   // Order items
//   const [items, setItems] = useState(order?.items || [])
//   const itemForm = useForm({ product_id: '', quantity: 1 })

//   function addItem(product) {
//     // optimistic UI
//     setItems(current => [
//       ...current,
//       {
//         id: Date.now(),
//         product_id: product.product_id,
//         product_title: product.product_title,
//         product_price: product.product_price,
//         quantity: 1,
//       }
//     ])
//     // actually send to server
//     itemForm.post(route('order-items.store'), {
//       data: { product_id: product.product_id, quantity: 1, order_id: order.order_id },
//       onSuccess: resp => setItems(resp.props.order.items)
//     })
//   }

//   function deleteItem(itemId) {
//     setItems(current => current.filter(i => i.id !== itemId))
//     itemForm.delete(route('order-items.destroy', itemId), {
//       onSuccess: resp => setItems(resp.props.order.items)
//     })
//   }

//   useEffect(() => {
//     document.getElementById('customer_name')?.focus()
//   }, [])

//   // group products by category
//   const grouped = useMemo(() => {
//     return products.reduce((acc, p) => {
//       const cat = p.category || 'Uncategorized'
//       if (!acc[cat]) acc[cat] = []
//       acc[cat].push(p)
//       return acc
//     }, {})
//   }, [products])

//   const title = isEdit ? 'Edit Order' : 'Create Order'
//   const crumbs = [
//     { title: 'Home', url: route('dashboard') },
//     { title: 'Orders', url: route('orders.index') },
//     { title, url: '' },
//   ]

//   return (
//     <AdminLayout breadcrumb={<Breadcrumb header={title} links={crumbs} />}>
//       <Head title={title} />

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* — LEFT: ORDER FORM — */}
//         {/* — RIGHT: PRODUCT CATALOG & CART — */}
//         <div className="lg:col-span-2 space-y-8">
//           {Object.entries(grouped).map(([category, prods]) => (
//             <div key={category}>
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-semibold">{category}</h3>
//                 <Link href="#" className="text-blue-600 hover:underline">View All</Link>
//               </div>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//                 {prods.slice(0, 4).map(prod => (
//                   <div key={prod.product_id} className="border rounded-lg p-4 flex flex-col items-center">
//                     <img
//                       src={prod.image_url}
//                       alt={prod.product_title}
//                       className="h-24 object-cover mb-2"
//                     />
//                     <h4 className="font-semibold text-center">{prod.product_title}</h4>
//                     <div className="text-sm text-gray-500 line-through">₹{prod.original_price.toFixed(2)}</div>
//                     <div className="text-lg font-bold">₹{prod.product_price.toFixed(2)}</div>
//                     <button
//                       onClick={() => addItem(prod)}
//                       className="mt-auto px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
//                     >
//                       Add
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           ))}

//           {/* — CART / ORDER ITEMS — */}
//           <div className="bg-white rounded-lg shadow p-6">
//             <h3 className="text-xl font-semibold mb-4">Product Order</h3>
//             {items.length > 0 ? (
//               <ul className="divide-y">
//                 {items.map(it => (
//                   <li key={it.id} className="py-3 flex justify-between items-center">
//                     <div>
//                       <div className="font-medium">{it.product_title}</div>
//                       <div className="text-sm text-gray-600">Qty: {it.quantity}</div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <div>₹{(it.product_price * it.quantity).toFixed(2)}</div>
//                       <button
//                         onClick={() => deleteItem(it.id)}
//                         className="text-red-500 hover:text-red-700"
//                       >
//                         <FiTrash2 />
//                       </button>
//                     </div>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-gray-500">No items in your cart.</p>
//             )}
//           </div>
//         </div>
//         <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
//           <form onSubmit={submitOrder} className="space-y-4">
//             <h3 className='font-bold'>Your Cart</h3>
//             {/* Customer Name */}
//             <div>
//               <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
//                 <span className="text-red-500">*</span> Customer Name
//               </label>
//               <input
//                 id="customer_name"
//                 name="customer_name"
//                 type="text"
//                 placeholder="Customer name…"
//                 value={data.customer_name}
//                 onChange={e => setData('customer_name', e.target.value)}
//                 className={`
//                   mt-1 block w-full px-4 py-2 border
//                   ${errors.customer_name ? 'border-red-500' : 'border-gray-300'}
//                   rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-600
//                 `}
//               />
//               <InputError message={errors.customer_name} className="mt-2" />
//             </div>

//             {/* Subtotal, Discount, Total, Payment */}
//             {[
//               { key: 'sub_total', label: 'Sub Total', required: true },
//               { key: 'discount', label: 'Discount', required: false },
//               { key: 'total', label: 'Total', required: true },
//               { key: 'total_payment', label: 'Total Payment', required: true },
//             ].map(({ key, label, required }) => (
//               <div key={key}>
//                 <label className="block text-sm font-medium text-gray-700">
//                   {label}
//                   {required && <span className="text-red-500">*</span>}
//                 </label>
//                 <input
//                   type="number"
//                   min="0"
//                   step="0.01"
//                   value={data[key]}
//                   readOnly={key !== 'sub_total' && key !== 'discount'}
//                   onChange={e => setData(key, e.target.value)}
//                   className={`
//                     mt-1 w-full border rounded-lg px-3 py-2 bg-white
//                     ${errors[key] ? 'border-red-500' : 'border-gray-300'}
//                   `}
//                 />
//                 <InputError message={errors[key]} className="mt-1" />
//               </div>
//             ))}

//             {/* Submit */}
//             <div className="flex justify-end space-x-2">
//               <Link
//                 href={route('orders.index')}
//                 className="px-4 py-2 bg-gray-200 rounded-full duration-200 transition hover:bg-gray-300 flex items-center space-x-1"
//               >
//                 <FiX /> <span>Cancel</span>
//               </Link>
//               <button
//                 type="submit"
//                 disabled={processing}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-full duration-200 transition hover:bg-blue-700 flex items-center space-x-1 disabled:opacity-50"
//               >
//                 <FiSave /> <span>{isEdit ? 'Update' : 'Create'}</span>
//               </button>
//             </div>

//             {recentlySuccessful && <p className="text-sm text-green-600">Saved.</p>}
//           </form>
//         </div>
//       </div>
//     </AdminLayout>
//   )
// }
