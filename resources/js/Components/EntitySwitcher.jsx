import React, { useState, useEffect, useRef } from 'react';
import { FaBoxes, FaTags, FaPalette, FaChevronDown, FaPlus, FaEye } from 'react-icons/fa';
import { Link, usePage } from '@inertiajs/react';

const EntitySwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { auth } = usePage().props;
    const user = auth.user;
    const isStaff = user?.roles?.some(role => role.name === 'Staff');

    // Available entities with their routes and icons
    const entities = [
        { 
            key: 'products', 
            name: 'Products', 
            icon: FaBoxes, 
            color: 'text-blue-500',
            bgColor: 'bg-blue-500',
            hoverColor: 'hover:bg-blue-600',
            route: 'products.index',
            createRoute: 'products.create',
            description: 'Manage product inventory'
        },
        { 
            key: 'categories', 
            name: 'Categories', 
            icon: FaTags, 
            color: 'text-green-500',
            bgColor: 'bg-green-500',
            hoverColor: 'hover:bg-green-600',
            route: 'categories.index',
            createRoute: 'categories.create',
            description: 'Organize product categories'
        },
        { 
            key: 'colors', 
            name: 'Colors', 
            icon: FaPalette, 
            color: 'text-purple-500',
            bgColor: 'bg-purple-500',
            hoverColor: 'hover:bg-purple-600',
            route: 'colors.index',
            createRoute: 'colors.create',
            description: 'Manage color variations'
        },
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Don't show for staff users
    if (isStaff) {
        return null;
    }

    return (
        <div className="relative ml-2" ref={dropdownRef}>
            <button
                className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Entity management switcher"
                title="Quick Management"
            >
                <div className="flex items-center space-x-1">
                    <FaBoxes className="text-gray-600 dark:text-gray-400 text-lg" />
                    <FaChevronDown
                        className={`text-gray-500 dark:text-gray-400 text-xs transition-transform duration-200 ${
                            isOpen ? 'transform rotate-180' : ''
                        }`}
                    />
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                        <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                            <FaBoxes className="mr-2 text-blue-500" />
                            <span>Quick Management</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Fast access to product management tools
                        </p>
                    </div>

                    {/* Entity List */}
                    <div className="py-2">
                        {entities.map((entity) => {
                            const IconComponent = entity.icon;
                            return (
                                <div key={entity.key} className="px-3 py-1">
                                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 group">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-full ${entity.bgColor} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-200`}>
                                                <IconComponent className={`text-sm ${entity.color}`} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-700 dark:text-gray-200 text-sm">
                                                    {entity.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {entity.description}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Link
                                                href={route(entity.route)}
                                                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                                onClick={() => setIsOpen(false)}
                                                title={`View all ${entity.name.toLowerCase()}`}
                                            >
                                                <FaEye className="w-3 h-3 mr-1" />
                                                View
                                            </Link>
                                            <Link
                                                href={route(entity.createRoute)}
                                                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-white transition-colors ${entity.bgColor} ${entity.hoverColor}`}
                                                onClick={() => setIsOpen(false)}
                                                title={`Add new ${entity.name.toLowerCase().slice(0, -1)}`}
                                            >
                                                <FaPlus className="w-3 h-3 mr-1" />
                                                Add
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Actions Footer */}
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                Quick access for admin users
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EntitySwitcher;
