// import React, { useEffect } from 'react';
// import 'admin-lte/dist/css/adminlte.min.css';
// import 'admin-lte/dist/js/adminlte.min.js';
// import $ from 'jquery';
// import { Link, usePage } from '@inertiajs/react';
// import OrderNotification from '@/Components/OrderNotification';
// import CreateEdit from '@/Pages/Orders/CreateEdit';
// import { MdHistory } from "react-icons/md";

// const StaffLayout = ({ breadcrumb, children }) => {
//     const user = usePage().props.auth.user;
//     const isStaff = user?.roles?.some(role => role.name === 'Staff');

//     return (
//         <div className="wrapper">
//             {/* Navbar */}
//             <nav>
//                 <ul className="navbar-nav ml-auto">
//                     <OrderNotification />
//                     <button>
//                         <MdHistory />
//                         <Link href={route('orders.history')} className="nav-link">
//                             Order History
//                         </Link>
//                     </button>
//                     <li className="nav-item dropdown">
//                         <a className="nav-link w-7 h-7" data-toggle="dropdown" href="#" role="button">
//                             <i className="far fa-user"></i>
//                         </a>
//                         <div className="dropdown-menu dropdown-menu-right">
//                             <Link href={route('profile.edit')} className="dropdown-item">Profile</Link>
//                             <div className="dropdown-divider"></div>
//                             <Link
//                                 className="dropdown-item"
//                                 method="post"
//                                 href={route('logout')}
//                                 as="button"
//                             >
//                                 Logout
//                             </Link>
//                         </div>
//                     </li>
//                 </ul>
//             </nav>          
//             <CreateEdit />
//             <footer className="main-footer">
//                 <strong>Copyright &copy; 2025</strong> All rights reserved.
//             </footer>
//         </div>
//     );
// };

// export default StaffLayout;