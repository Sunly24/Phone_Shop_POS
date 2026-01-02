import React from "react";
import { Transition } from "@headlessui/react";

export default function ActionMessage({ on, className, children }) {
    return (
        <Transition
            show={on}
            enterFrom="opacity-0"
            leaveTo="opacity-0"
            className={className}
        >
            <div className="text-sm text-gray-600">{children}</div>
        </Transition>
    );
}
