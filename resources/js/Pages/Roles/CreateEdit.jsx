import { Head, Link, useForm } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { FiSave, FiX, FiPlusCircle, FiEdit2, FiShield } from "react-icons/fi";
import Breadcrumb from "@/Components/Breadcrumb";
import InputError from "@/Components/InputError";
import AdminLayout from "@/Layouts/AdminLayout";
import React, { useEffect, useMemo } from "react";

export default function RoleCreateEdit({ role, permissions }) {
    const {
        data,
        setData,
        post,
        patch,
        errors,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        name: role?.name || "",
        permissions: [],
    });

    useEffect(() => {
        if (role !== undefined) {
            const permIds = role.permissions.map((p) => p.id);
            setData("permissions", permIds);
        }
    }, [role]);

    // Group permissions by sections and entity types - matching menu sidebar structure
    const permissionGroups = useMemo(() => {
        const groups = {
            dashboard: {
                title: "Dashboard Analytics",
                entities: {},
            },
            productManagement: {
                title: "Product Management",
                entities: {},
            },
            orderManagement: {
                title: "Order Management",
                entities: {},
            },
            inventoryManagement: {
                title: "Inventory Management",
                entities: {},
            },
            userRoleManagement: {
                title: "User & Role Management",
                entities: {},
            },
            communication: {
                title: "Communication",
                entities: {},
            },
            systemSettings: {
                title: "System Settings",
                entities: {},
            },
        };

        permissions.forEach((permission) => {
            const name = permission.name.toLowerCase();
            let section = "dashboard"; // default
            let entityName = "";

            // Skip product-image and subcategory permissions
            if (
                name.includes("product-image") ||
                name.includes("subcategory")
            ) {
                return; // Skip this permission
            }

            // Determine section and entity based on menu structure
            if (
                name.includes("product") ||
                name.includes("category") ||
                name.includes("brand") ||
                name.includes("color") ||
                name.includes("size") ||
                name.includes("maker")
            ) {
                section = "productManagement";
            } else if (name.includes("order")) {
                section = "orderManagement";
            } else if (name.includes("inventory") || name.includes("invoice")) {
                section = "inventoryManagement";
            } else if (name.includes("user") || name.includes("role")) {
                section = "userRoleManagement";
            } else if (name.includes("chat")) {
                section = "communication";
            } else if (
                name.includes("activity-log") ||
                name.includes("verify") ||
                name.includes("telegram")
            ) {
                section = "systemSettings";
            }

            // Extract entity name with more specific matching
            if (name.includes("order")) entityName = "order";
            else if (name.includes("product")) entityName = "product";
            else if (name.includes("category")) entityName = "category";
            else if (name.includes("brand")) entityName = "brand";
            else if (name.includes("maker")) entityName = "maker";
            else if (name.includes("size")) entityName = "size";
            else if (name.includes("color")) entityName = "color";
            else if (name.includes("inventory")) entityName = "inventory";
            else if (name.includes("invoice")) entityName = "invoice";
            else if (name.includes("user")) entityName = "user";
            else if (name.includes("role")) entityName = "role";
            else if (name.includes("activity-log")) entityName = "activity-log";
            else if (name.includes("invoiceorder"))
                entityName = "invoice-order";
            else if (name.includes("chat")) entityName = "chat";
            else if (name.includes("verify")) entityName = "telegram";
            else {
                // Skip unmatched permissions instead of putting them in system
                return;
            }

            // Initialize entity group if doesn't exist
            if (!groups[section].entities[entityName]) {
                groups[section].entities[entityName] = {
                    title:
                        entityName.charAt(0).toUpperCase() +
                        entityName.slice(1).replace("-", " "),
                    permissions: [],
                };
            }

            groups[section].entities[entityName].permissions.push(permission);
        });

        return groups;
    }, [permissions]);

    const handleSelectPermission = (e) => {
        const id = parseInt(e.target.value);
        if (e.target.checked) {
            if (!data.permissions.includes(id)) {
                setData("permissions", [...data.permissions, id]);
            }
        } else {
            setData(
                "permissions",
                data.permissions.filter((p) => p !== id)
            );
        }
    };

    const handleSelectAllSection = (sectionEntities, checked) => {
        const allSectionPermissions = Object.values(sectionEntities).flatMap(
            (entity) => entity.permissions
        );
        const sectionIds = allSectionPermissions.map((p) => p.id);

        if (checked) {
            const newPermissions = [...data.permissions];
            sectionIds.forEach((id) => {
                if (!newPermissions.includes(id)) {
                    newPermissions.push(id);
                }
            });
            setData("permissions", newPermissions);
        } else {
            setData(
                "permissions",
                data.permissions.filter((id) => !sectionIds.includes(id))
            );
        }
    };

    const handleSelectAllEntity = (entityPermissions, checked) => {
        const entityIds = entityPermissions.map((p) => p.id);

        if (checked) {
            const newPermissions = [...data.permissions];
            entityIds.forEach((id) => {
                if (!newPermissions.includes(id)) {
                    newPermissions.push(id);
                }
            });
            setData("permissions", newPermissions);
        } else {
            setData(
                "permissions",
                data.permissions.filter((id) => !entityIds.includes(id))
            );
        }
    };

    const isSectionFullySelected = (sectionEntities) => {
        const allSectionPermissions = Object.values(sectionEntities).flatMap(
            (entity) => entity.permissions
        );
        return allSectionPermissions.every((p) =>
            data.permissions.includes(p.id)
        );
    };

    const isSectionPartiallySelected = (sectionEntities) => {
        const allSectionPermissions = Object.values(sectionEntities).flatMap(
            (entity) => entity.permissions
        );
        return (
            allSectionPermissions.some((p) =>
                data.permissions.includes(p.id)
            ) && !isSectionFullySelected(sectionEntities)
        );
    };

    const isEntityFullySelected = (entityPermissions) => {
        return entityPermissions.every((p) => data.permissions.includes(p.id));
    };

    const isEntityPartiallySelected = (entityPermissions) => {
        return (
            entityPermissions.some((p) => data.permissions.includes(p.id)) &&
            !isEntityFullySelected(entityPermissions)
        );
    };

    const submit = (e) => {
        e.preventDefault();
        if (role == undefined) {
            post(route("roles.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                },
            });
        } else {
            patch(route("roles.update", role.id), {
                preserveScroll: true,
                onSuccess: () => {
                    reset();
                },
            });
        }
    };

    const isEdit = Boolean(role);
    const title = isEdit ? "Edit Role" : "Create Role";
    const crumbs = [
        { title: "Home", url: route("dashboard") },
        { title: "Roles", url: route("roles.index") },
        { title, url: "" },
    ];

    return (
        <AdminLayout breadcrumb={<Breadcrumb header={title} links={crumbs} />}>
            <Head title={title} />

            <div className="w-full h-screen bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-200 flex flex-col">
                {/* Top border accent with gradient */}
                <div
                    className={`h-2 ${
                        isEdit
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                            : "bg-gradient-to-r from-blue-500 to-blue-700"
                    }`}
                />

                {/* Header section */}
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex items-center space-x-4">
                    <div
                        className={`p-3 rounded-full ${
                            isEdit
                                ? "bg-yellow-100 dark:bg-yellow-900/20"
                                : "bg-blue-100 dark:bg-blue-900/20"
                        } transform hover:scale-110 transition-all duration-200`}
                    >
                        {isEdit ? (
                            <FiEdit2 className="w-7 h-7 text-yellow-500 dark:text-yellow-400" />
                        ) : (
                            <FiPlusCircle className="w-7 h-7 text-blue-500 dark:text-blue-400" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">
                            {title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isEdit
                                ? "Update existing role and permissions below"
                                : "Create a new role and assign permissions"}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="flex-1 overflow-y-auto px-8 py-8 space-y-8"
                >
                    {/* Error messages */}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-xl shadow-sm">
                            <p className="font-bold">
                                Please fix the following errors:
                            </p>
                            <ul className="list-disc pl-5">
                                {Object.entries(errors).map(
                                    ([field, message]) => (
                                        <li key={field}>
                                            {field}: {message}
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Role Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Role Name{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${
                                        errors.name
                                            ? "border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30"
                                            : ""
                                    }
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                placeholder="Enter role name"
                                autoFocus
                            />
                            <InputError
                                message={errors.name}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    {/* Permissions Section */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                Permissions{" "}
                                <span className="text-red-500">*</span>
                            </label>

                            {Object.entries(permissionGroups).map(
                                ([sectionKey, section]) =>
                                    Object.keys(section.entities).length >
                                        0 && (
                                        <div
                                            key={sectionKey}
                                            className="mb-8 p-6 border-2 border-blue-200 dark:border-blue-800 rounded-xl bg-blue-50 dark:bg-blue-900/20 shadow-sm"
                                        >
                                            {/* Section Header with Select All */}
                                            <div className="flex items-center mb-6 pb-4 border-b-2 border-blue-300 dark:border-blue-700">
                                                <input
                                                    type="checkbox"
                                                    id={`select-all-section-${sectionKey}`}
                                                    checked={isSectionFullySelected(
                                                        section.entities
                                                    )}
                                                    ref={(input) => {
                                                        if (input)
                                                            input.indeterminate =
                                                                isSectionPartiallySelected(
                                                                    section.entities
                                                                );
                                                    }}
                                                    onChange={(e) =>
                                                        handleSelectAllSection(
                                                            section.entities,
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="h-5 w-5 text-blue-600 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 mr-3"
                                                />
                                                <label
                                                    htmlFor={`select-all-section-${sectionKey}`}
                                                    className="text-lg font-bold text-blue-800 dark:text-blue-200 cursor-pointer flex items-center gap-2"
                                                >
                                                    <FiShield className="w-5 h-5" />
                                                    {section.title} (Select All)
                                                </label>
                                            </div>

                                            {/* Entities Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {Object.entries(
                                                    section.entities
                                                ).map(([entityKey, entity]) => (
                                                    <div
                                                        key={entityKey}
                                                        className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
                                                    >
                                                        {/* Entity Header */}
                                                        <div className="flex items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                                                            <input
                                                                type="checkbox"
                                                                id={`select-all-entity-${entityKey}`}
                                                                checked={isEntityFullySelected(
                                                                    entity.permissions
                                                                )}
                                                                ref={(
                                                                    input
                                                                ) => {
                                                                    if (input)
                                                                        input.indeterminate =
                                                                            isEntityPartiallySelected(
                                                                                entity.permissions
                                                                            );
                                                                }}
                                                                onChange={(e) =>
                                                                    handleSelectAllEntity(
                                                                        entity.permissions,
                                                                        e.target
                                                                            .checked
                                                                    )
                                                                }
                                                                className="h-4 w-4 text-blue-600 dark:text-blue-400 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 mr-2"
                                                            />
                                                            <label
                                                                htmlFor={`select-all-entity-${entityKey}`}
                                                                className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                                                            >
                                                                {entity.title}
                                                            </label>
                                                        </div>

                                                        {/* Individual Permissions */}
                                                        <div className="space-y-2">
                                                            {entity.permissions.map(
                                                                (
                                                                    permission
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            permission.id
                                                                        }
                                                                        className="flex items-center"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`permission-${permission.id}`}
                                                                            value={
                                                                                permission.id
                                                                            }
                                                                            checked={data.permissions.includes(
                                                                                permission.id
                                                                            )}
                                                                            onChange={
                                                                                handleSelectPermission
                                                                            }
                                                                            className="h-4 w-4 text-blue-600 dark:text-blue-400 border border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 mr-2"
                                                                        />
                                                                        <label
                                                                            htmlFor={`permission-${permission.id}`}
                                                                            className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
                                                                        >
                                                                            {
                                                                                permission.name
                                                                            }
                                                                        </label>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                            )}

                            <InputError
                                message={errors.permissions}
                                className="mt-2 text-sm text-red-500 dark:text-red-400"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-800">
                        <Transition
                            show={recentlySuccessful}
                            enter="transition-opacity duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity duration-150"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-md">
                                <svg
                                    className="-ml-1 mr-2 h-4 w-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                {isEdit
                                    ? "Role updated successfully"
                                    : "Role created successfully"}
                            </div>
                        </Transition>
                        <div className="flex space-x-4">
                            <Link
                                href={route("roles.index")}
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
                                    ${
                                        isEdit
                                            ? "bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:ring-yellow-400 text-white"
                                            : "bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:ring-blue-400 text-white"
                                    }
                                    disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                {processing ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        {isEdit ? "Updating..." : "Creating..."}
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-5 h-5" />
                                        <span>
                                            {isEdit
                                                ? "Update Role"
                                                : "Create Role"}
                                        </span>
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
