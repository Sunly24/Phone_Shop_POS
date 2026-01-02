import { useState, forwardRef } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const PasswordInput = forwardRef(function PasswordInput(
    { className = "", placeholder = "Enter password", ...props },
    ref
) {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="relative">
            <input
                {...props}
                type={showPassword ? "text" : "password"}
                className={
                    "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm pr-10 " +
                    className
                }
                ref={ref}
                placeholder={placeholder}
            />
            <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
            </button>
        </div>
    );
});

export default PasswordInput;
