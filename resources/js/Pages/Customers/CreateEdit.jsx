import { Head, Link, useForm } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import Breadcrumb from "@/Components/Breadcrumb";
import InputError from "@/Components/InputError";
import AdminLayout from "@/Layouts/AdminLayout";
import { FiSave, FiX } from "react-icons/fi";

export default function CustomerCreateEdit({ customer }) {
    const isEdit = Boolean(customer && customer.customer_id);
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
        name: customer?.name || "",
        phone: customer?.phone || "",
        password: "",
    });

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            patch(route("customers.update", { id: customer.customer_id }), {
                preserveState: true,
                onFinish: () => reset(),
            });
        } else {
            post(route("customers.store"), {
                preserveState: true,
                onFinish: () => reset(),
            });
        }
    }

    const title = isEdit ? "Edit Customer" : "Create Customer";
    const crumbs = [
        { title: "Home", url: route("dashboard") },
        { title: "Customers", url: route("customers.index") },
        { title, url: "" },
    ];

    return (
        <AdminLayout breadcrumb={<Breadcrumb header={title} links={crumbs} />}>
            <Head title={title} />

            <div className="mx-auto bg-white shadow rounded-lg overflow-hidden">
                {/* top border accent */}
                <div className="h-1 bg-blue-600" />
                {/* header */}
                <div className="px-6 py-4 border-b">
                    <h2 className="text-2xl font-semibold text-gray-800">
                        Customer Details
                    </h2>
                </div>

                <form onSubmit={submit} className="px-6 py-6 space-y-6">
                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700"
                        >
                            <span className="text-red-500">*</span> Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Enter customer name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className={`mt-1 block w-full border border-gray-200 rounded-lg shadow-sm px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent ${errors.name ? "border-red-500" : ""
                                }`}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700"
                        >
                            <span className="text-red-500">*</span> Phone
                        </label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="Enter customer phone"
                            value={data.phone}
                            onChange={(e) => setData("phone", e.target.value)}
                            className={`mt-1 block w-full border border-gray-200 rounded-lg shadow-sm px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent ${errors.phone ? "border-red-500" : ""
                                }`}
                        />
                        <InputError message={errors.phone} className="mt-2" />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            {isEdit ? (
                                "Password (leave blank to keep current)"
                            ) : (
                                <>
                                    <span className="text-red-500">*</span> Password
                                </>
                            )}
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder={isEdit ? "Enter new password (optional)" : "Enter password"}
                            value={data.password}
                            onChange={(e) => setData("password", e.target.value)}
                            className={`mt-1 block w-full border border-gray-200 rounded-lg shadow-sm px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-transparent ${errors.password ? "border-red-500" : ""
                                }`}
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>


                    {/* actions */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-2">
                        <Link
                            href={route("customers.index")}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-full shadow-sm
                         hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1
                         transition duration-150"
                        >
                            <FiX className="w-4 h-4" />
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-full shadow-sm
                         hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                         transition duration-150 disabled:opacity-50"
                        >
                            <FiSave className="w-4 h-4" />
                            {processing
                                ? isEdit
                                    ? "Updating…"
                                    : "Saving…"
                                : isEdit
                                    ? "Update Customer"
                                    : "Create Customer"}
                        </button>
                    </div>

                    {/* saved flash */}
                    <Transition
                        show={recentlySuccessful}
                        enter="transition-opacity duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-green-600">Saved.</p>
                    </Transition>
                </form>
            </div>
        </AdminLayout>
    );
}
