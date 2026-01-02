import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Breadcrumb from '@/Components/Breadcrumb';
import { FiArrowLeft, FiShield, FiUsers } from 'react-icons/fi';

export default function RoleShow({ role }) {
    const headWeb = `Role: ${role.name}`;
    const crumbs = [
        { title: 'Home', url: route('dashboard') },
        { title: 'Roles', url: route('roles.index') },
        { title: role.name, url: '' },
    ];

    return (
        <AdminLayout breadcrumb={<Breadcrumb header={headWeb} links={crumbs} />}>
            <Head title={headWeb} />

            <div className="px-6 py-4 space-y-6 mx-auto">
                {/* Back Button */}
                <div className="flex items-center space-x-4">
                    <Link
                        href={route('roles.index')}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-150"
                    >
                        <FiArrowLeft className="w-4 h-4" />
                        Back to Roles
                    </Link>
                </div>

                {/* Role Details Card */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                        <div className="flex items-center space-x-3">
                            <FiShield className="w-8 h-8 text-white" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">{role.name}</h1>
                                <p className="text-blue-100">Role Details & Permissions</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <FiUsers className="w-5 h-5" />
                                    Basic Information
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-600">Role ID:</span>
                                        <span className="text-gray-900">#{role.id}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-600">Role Name:</span>
                                        <span className="text-gray-900 font-semibold">{role.name}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-600">Guard Name:</span>
                                        <span className="text-gray-900">{role.guard_name}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-gray-100">
                                        <span className="font-medium text-gray-600">Created At:</span>
                                        <span className="text-gray-900">
                                            {new Date(role.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2">
                                        <span className="font-medium text-gray-600">Updated At:</span>
                                        <span className="text-gray-900">
                                            {new Date(role.updated_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Permissions */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <FiShield className="w-5 h-5" />
                                    Assigned Permissions
                                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                        {role.permissions?.length || 0}
                                    </span>
                                </h3>
                                <div className="max-h-96 overflow-y-auto">
                                    {role.permissions && role.permissions.length > 0 ? (
                                        <div className="space-y-2">
                                            {role.permissions.map((permission) => (
                                                <div
                                                    key={permission.id}
                                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition duration-150"
                                                >
                                                    <div>
                                                        <span className="font-medium text-gray-900">
                                                            {permission.name}
                                                        </span>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            ID: #{permission.id} | Guard: {permission.guard_name}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                            Active
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <FiShield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">No permissions assigned</p>
                                            <p className="text-gray-400 text-sm">This role doesn't have any permissions yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
