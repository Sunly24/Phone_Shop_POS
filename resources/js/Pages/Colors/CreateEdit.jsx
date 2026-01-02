import { Head, Link, useForm } from "@inertiajs/react";
import { Transition } from "@headlessui/react";
import { FiSave, FiX, FiPlusCircle, FiEdit2 } from "react-icons/fi";
import Breadcrumb from "@/Components/Breadcrumb";
import InputError from "@/Components/InputError";
import AdminLayout from "@/Layouts/AdminLayout";

export default function ColorCreateEdit({ color }) {
    const isEdit = Boolean(color && color.color_id);
    const { data, setData, post, patch, errors, processing, recentlySuccessful } = useForm({
        color_title: color?.color_title || "",
    });

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            patch(route("colors.update", { color: color.color_id }), {
                preserveState: true,
            });
        } else {
            post(route("colors.store"), {
                preserveState: true,
            });
        }
    }

    const title = isEdit ? "Edit Color" : "Create New Color";
    const crumbs = [
        { title: "Home", url: route("dashboard") },
        { title: "Colors", url: route("colors.index") },
        { title, url: "" },
    ];

    return (
        <AdminLayout breadcrumb={<Breadcrumb header={title} links={crumbs} />}>
            <Head title={title} />

            <div className="w-full h-screen bg-white dark:bg-gray-900 shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-200">
                {/* Top border accent with gradient */}
                <div className={`h-2 ${isEdit ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-blue-500 to-blue-700'}`} />

                {/* Header section */}
                <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${isEdit ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-blue-100 dark:bg-blue-900/20'} transform hover:scale-110 transition-all duration-200`}>
                        {isEdit ? (
                            <FiEdit2 className="w-7 h-7 text-yellow-500 dark:text-yellow-400" />
                        ) : (
                            <FiPlusCircle className="w-7 h-7 text-blue-500 dark:text-blue-400" />
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">{title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isEdit ? 'Update existing color details below' : 'Add a new color to the system'}
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="px-8 py-8 space-y-8">
                    {/* Color Title */}
                    <div>
                        <label htmlFor="color_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Color Title <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="color_title"
                                name="color_title"
                                type="text"
                                placeholder="Enter color (e.g., Red, Blue, #FFFFFF)"
                                value={data.color_title}
                                onChange={(e) => setData("color_title", e.target.value)}
                                className={`block w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 
                                    text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
                                    focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/30 
                                    ${errors.color_title ? 'border-red-500 dark:border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30' : ''}
                                    transition-all duration-200 ease-in-out py-3 px-4 text-sm shadow-sm`}
                                autoFocus
                            />
                            {errors.color_title && (
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        <InputError message={errors.color_title} className="mt-2 text-sm text-red-500 dark:text-red-400" />
                    </div>

                    {/* Actions section */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 rounded-xl flex justify-between items-center shadow-inner">
                        <Transition
                            show={recentlySuccessful}
                            enter="transition-opacity duration-200"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-md">
                                <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {isEdit ? 'Color updated successfully' : 'Color created successfully'}
                            </div>
                        </Transition>
                        <div className="flex space-x-4">
                            <Link
                                href={route("colors.index")}
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
                                    ${isEdit
                                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 focus:ring-yellow-400 text-white'
                                        : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:ring-blue-400 text-white'}
                                    disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {isEdit ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="w-5 h-5" />
                                        <span>{isEdit ? 'Update Color' : 'Create Color'}</span>
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