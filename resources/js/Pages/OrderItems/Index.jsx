// import React from 'react';
// import { Head, Link, usePage } from '@inertiajs/react';
// import AdminLayout from '@/Layouts/AdminLayout';
// import Breadcrumb from '@/Components/Breadcrumb';

// export default function Index() {
//     const { orderItems } = usePage().props;

//     return (
//         <AdminLayout title="Order Items">
//             <Head title="Order Items" />
//             <Breadcrumb items={[{ name: 'Order Items' }]} />

//             <div className="flex justify-between mb-4">
//                 <Link href={route('order-items.create')} className="btn-primary">
//                     New Item
//                 </Link>
//             </div>

//             <table className="table-auto w-full">
//                 <thead>
//                     <tr>
//                         <th>ID</th>
//                         <th>Order ID</th>
//                         <th>Product</th>
//                         <th>Quantity</th>
//                         <th>Price</th>
//                         <th>Total</th>
//                         <th className="text-right">Actions</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {orderItems.data.map(item => (
//                         <tr key={item.id}>
//                             <td>{item.id}</td>
//                             <td>{item.order_id}</td>
//                             <td>{item.product_name}</td>
//                             <td>{item.quantity}</td>
//                             <td>{item.price}</td>
//                             <td>{item.quantity * item.price}</td>
//                             <td className="text-right">
//                                 <Link href={route('order-items.edit', item.id)} className="btn-sm mr-2">Edit</Link>
//                                 <Link
//                                     method="delete"
//                                     href={route('order-items.destroy', item.id)}
//                                     className="btn-sm btn-danger"
//                                 >
//                                     Delete
//                                 </Link>
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>

//             <div className="mt-4">{orderItems.links}</div>
//         </AdminLayout>
//     );
// }