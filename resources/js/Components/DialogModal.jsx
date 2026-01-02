import React from "react";
import Modal from "./Modal";

export default function DialogModal({ children, ...props }) {
    return (
        <Modal {...props}>
            <div className="px-6 py-4">
                <div className="text-lg font-medium text-gray-900">
                    {props.title}
                </div>

                <div className="mt-4 text-sm text-gray-600">
                    {props.content}
                </div>
            </div>

            <div className="flex flex-row justify-end px-6 py-4 bg-gray-100 text-end">
                {props.footer}
            </div>
        </Modal>
    );
}
