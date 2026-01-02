import React, { useState, Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { FiDownload, FiChevronDown } from "react-icons/fi";
import { FaFilePdf, FaFileExcel } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function ExportDropdown({
    exportUrl,
    pdfExportUrl = null,
    currentFilters = {},
    className = "",
    buttonText = "Export Data",
}) {
    const [isExporting, setIsExporting] = useState(false);
    const { t } = useTranslation();

    const exportFormats = [
        {
            id: "pdf",
            name: t("export.exportPdf"),
            icon: FaFilePdf,
            color: "text-red-600",
            bgColor: "bg-red-50",
            description: t("export.pdf.description"),
        },
        {
            id: "xlsx",
            name: t("export.exportExcel"),
            icon: FaFileExcel,
            color: "text-green-600",
            bgColor: "bg-green-50",
            description: "Microsoft Excel Spreadsheet",
        },
    ];

    const handleExport = async (format) => {
        setIsExporting(true);

        try {
            // Choose the appropriate URL based on format
            let actionUrl = exportUrl; // Default to the original export URL

            // If PDF format is selected and we have a dedicated PDF export URL, use it
            if (format.id === "pdf" && pdfExportUrl) {
                actionUrl = pdfExportUrl;
            }

            // Build URL with query parameters
            const url = new URL(actionUrl, window.location.origin);
            url.searchParams.append("format", format.id);

            // Add filters as query parameters
            Object.entries(currentFilters).forEach(([key, value]) => {
                if (value && value !== "") {
                    url.searchParams.append(key, value);
                }
            });

            // Use window.location to trigger download - this maintains session
            window.location.href = url.toString();

            // Set a timeout to reset the exporting state
            setTimeout(() => {
                setIsExporting(false);
            }, 3000);
        } catch (error) {
            
            alert("Export failed. Please try again.");
            setIsExporting(false);
        }
    };

    return (
        <div className={className}>
            <Menu as="div" className="relative inline-block text-left">
                <div>
                    <Menu.Button
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-sm
                        hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
                        transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
                    >
                        {isExporting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Exporting...</span>
                            </>
                        ) : (
                            <>
                                <FiDownload className="w-4 h-4" />
                                <span>{buttonText}</span>
                                <FiChevronDown className="w-4 h-4" />
                            </>
                        )}
                    </Menu.Button>
                </div>
                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                            {exportFormats.map((format) => (
                                <Menu.Item key={format.id}>
                                    {({ active }) => (
                                        <button
                                            onClick={() => handleExport(format)}
                                            disabled={isExporting}
                                            className={`${active
                                                    ? "bg-gray-100 text-gray-900"
                                                    : "text-gray-700"
                                                } group flex w-full items-center px-4 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            <div
                                                className={`p-2 rounded-full ${format.bgColor} mr-3`}
                                            >
                                                <format.icon
                                                    className={`h-4 w-4 ${format.color}`}
                                                />
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="font-medium">
                                                    {format.name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {format.description}
                                                </span>
                                            </div>
                                        </button>
                                    )}
                                </Menu.Item>
                            ))}
                        </div>
                    </Menu.Items>
                </Transition>
            </Menu>
        </div>
    );
}
