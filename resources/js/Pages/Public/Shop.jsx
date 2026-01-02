import PublicLayout from "@/Layouts/PublicLayout";
import { Link, router, usePage } from "@inertiajs/react";
import { useState, useEffect, useCallback } from "react";
import { FEATURED_BRANDS } from "@/constants/brands";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { addItem } from "@/Pages/store/orderSlice";
import { FiX } from "react-icons/fi";

export default function Shop({ products, categories, brands, filters, seo }) {
    const [search, setSearch] = useState(filters.search || "");
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category || ""
    );
    const [selectedBrand, setSelectedBrand] = useState(filters.brand || "");

    // Client-side filtered products
    const [filteredProducts, setFilteredProducts] = useState(
        products.data || []
    );
    const [isFiltering, setIsFiltering] = useState(false);

    // Filter products client-side for smooth experience
    const filterProductsClientSide = useCallback(
        (searchTerm, categoryId, brandId) => {
            setIsFiltering(true);

            let filtered = products.data || [];

            // Apply search filter
            if (searchTerm && searchTerm.trim()) {
                filtered = filtered.filter((product) =>
                    product.product_title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                );
            }

            // Apply category filter
            if (categoryId) {
                filtered = filtered.filter(
                    (product) => product.category_id === parseInt(categoryId)
                );
            }

            // Apply brand filter
            if (brandId) {
                filtered = filtered.filter(
                    (product) => product.brand_id === parseInt(brandId)
                );
            }

            setTimeout(() => {
                setFilteredProducts(filtered);
                setIsFiltering(false);
            }, 200);
        },
        [products.data]
    );

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            filterProductsClientSide(search, selectedCategory, selectedBrand);
        }, 300); // Reduced delay for better UX

        return () => clearTimeout(timeoutId);
    }, [search, selectedCategory, selectedBrand, filterProductsClientSide]);

    // Initialize filtered products
    useEffect(() => {
        filterProductsClientSide(search, selectedCategory, selectedBrand);
    }, []);

    // Reset filtered products when products data changes (e.g., after URL navigation)
    useEffect(() => {
        setFilteredProducts(products.data || []);
        filterProductsClientSide(search, selectedCategory, selectedBrand);
    }, [products.data, filterProductsClientSide]);

    // Sync local state with URL parameters when filters prop changes
    useEffect(() => {
        setSearch(filters.search || "");
        setSelectedCategory(filters.category || "");
        setSelectedBrand(filters.brand || "");
    }, [filters]);

    // Embla Carousel setup
    const autoplayOptions = {
        delay: 5000,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: false,
    };

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            loop: true,
            align: "center",
            containScroll: "trimSnaps",
            dragFree: false,
            skipSnaps: false,
            slidesToScroll: 1,
            startIndex: 0,
        },
        [Autoplay(autoplayOptions)]
    );

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState([]);

    const scrollPrev = useCallback(
        () => emblaApi && emblaApi.scrollPrev(),
        [emblaApi]
    );

    const scrollNext = useCallback(
        () => emblaApi && emblaApi.scrollNext(),
        [emblaApi]
    );

    const scrollTo = useCallback(
        (index) => emblaApi && emblaApi.scrollTo(index),
        [emblaApi]
    );

    const onInit = useCallback((emblaApi) => {
        setScrollSnaps(emblaApi.scrollSnapList());
    }, []);

    const onSelect = useCallback((emblaApi) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;

        onInit(emblaApi);
        onSelect(emblaApi);
        emblaApi.on("reInit", onInit);
        emblaApi.on("select", onSelect);
    }, [emblaApi, onInit, onSelect]);

    const selectBrand = (brandTitle) => {
        // Find the actual brand from the database brands array
        const actualBrand = brands.find(
            (brand) => brand.brand_title === brandTitle
        );
        if (actualBrand) {
            setSelectedBrand(actualBrand.brand_id.toString());
            router.get("/shop", {
                search: search,
                category: selectedCategory,
                brand: actualBrand.brand_id,
                per_page: filters.per_page || 12,
            });
        } else {
            // If brand not found in database, just clear filters and go to shop
            router.get("/shop");
        }
    };

    // Auto-apply filters when category or brand changes
    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        // Navigate to update URL and get fresh data from server
        const params = {};
        if (search) params.search = search;
        if (categoryId) params.category = categoryId;
        if (selectedBrand) params.brand = selectedBrand;
        if (filters.per_page) params.per_page = filters.per_page;

        router.get("/shop", params, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const handleBrandChange = (brandId) => {
        setSelectedBrand(brandId);
        // Navigate to update URL and get fresh data from server
        const params = {};
        if (search) params.search = search;
        if (selectedCategory) params.category = selectedCategory;
        if (brandId) params.brand = brandId;
        if (filters.per_page) params.per_page = filters.per_page;

        router.get("/shop", params, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const handleFilter = () => {
        // For manual search trigger (if needed)
        filterProductsClientSide(search, selectedCategory, selectedBrand);
    };

    const clearFilters = () => {
        setSearch("");
        setSelectedCategory("");
        setSelectedBrand("");
        // Navigate to clean shop URL without any filters
        router.get(
            "/shop",
            {},
            {
                preserveScroll: true,
                preserveState: false,
            }
        );
    };

    const dispatch = useDispatch();
    const { auth } = usePage().props;
    // add product to cart
    const handleAddToCart = (product) => {
        if (!auth?.user) {
            router.visit("/login");
            return;
        }
        dispatch(addItem(product));
    };

    return (
        <PublicLayout seo={seo}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filters */}
                <div className="bg-white rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">
                        Filter Products
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-10 gap-4 items-end">
                        {/* Search */}
                        <div className="md:col-span-5">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search phones..."
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {isFiltering && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category Filter */}
                        <div className="md:col-span-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) =>
                                    handleCategoryChange(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Categories</option>
                                {categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Brand Filter */}
                        <div className="md:col-span-2">
                            <select
                                value={selectedBrand}
                                onChange={(e) =>
                                    handleBrandChange(e.target.value)
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Brands</option>
                                {brands.map((brand) => (
                                    <option
                                        key={brand.brand_id}
                                        value={brand.brand_id}
                                    >
                                        {brand.brand_title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Clear Filter Button */}
                        <div>
                            <button
                                onClick={clearFilters}
                                className=" w-17 h-10 text-gray-500 px-4 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-200 font-bold flex items-center justify-center"
                                title="Clear All Filters"
                            >
                                <FiX className="w-7 h-7" />
                                <span className="sr-only">
                                    Clear All Filters
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modern Banner Slider with Embla Carousel and Peek Effect */}
                <div className="relative mb-8">
                    <div className="embla overflow-hidden" ref={emblaRef}>
                        <div className="embla__container flex">
                            {FEATURED_BRANDS.map((brand, index) => (
                                <div
                                    key={brand.brand_id}
                                    className="embla__slide relative"
                                >
                                    <div
                                        className={`relative h-80 md:h-96 lg:h-[500px] rounded-2xl overflow-hidden transition-all duration-500 ${
                                            index === selectedIndex
                                                ? "scale-100 opacity-100"
                                                : "scale-95 opacity-75 hover:opacity-90"
                                        }`}
                                    >
                                        {/* Background Image */}
                                        <div className="absolute inset-0">
                                            <img
                                                src={brand.image}
                                                alt={brand.brand_title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = `https://via.placeholder.com/1200x500/1f2937/ffffff?text=${brand.brand_title}`;
                                                }}
                                            />
                                            {/* Gradient Overlay */}
                                            <div
                                                className={`absolute inset-0 ${
                                                    index === selectedIndex
                                                        ? "bg-gradient-to-r from-black/70 via-black/40 to-transparent"
                                                        : "bg-black/60"
                                                }`}
                                            ></div>
                                        </div>

                                        {/* Content - Only show on active slide */}
                                        {index === selectedIndex && (
                                            <div className="absolute inset-0 flex items-center justify-start z-20 p-6 md:p-8 lg:p-12">
                                                <div className="text-white max-w-xs md:max-w-md lg:max-w-lg">
                                                    <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold mb-3 md:mb-4 lg:mb-6 leading-tight">
                                                        {brand.brand_title}
                                                    </h1>
                                                    <p className="text-sm md:text-base lg:text-xl mb-4 md:mb-6 lg:mb-8 text-gray-200 leading-relaxed">
                                                        {brand.description}
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                            selectBrand(
                                                                brand.brand_title
                                                            )
                                                        }
                                                        className="bg-white text-gray-900 px-6 md:px-8 py-3 md:py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm md:text-base"
                                                    >
                                                        Shop {brand.brand_title}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Inactive slide overlay */}
                                        {index !== selectedIndex && (
                                            <div
                                                className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer"
                                                onClick={() => scrollTo(index)}
                                            >
                                                <div className="text-white text-center p-4">
                                                    <h3 className="text-xl md:text-2xl font-bold mb-2">
                                                        {brand.brand_title}
                                                    </h3>
                                                    <p className="text-sm text-gray-300">
                                                        Click to view
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
                        {scrollSnaps.map((_, index) => (
                            <button
                                key={`carousel-dot-${index}`}
                                onClick={() => scrollTo(index)}
                                className={`transition-all duration-300 ${
                                    index === selectedIndex
                                        ? "w-8 h-3 bg-white rounded-full"
                                        : "w-3 h-3 bg-white/50 rounded-full hover:bg-white/70"
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Results Summary */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <p className="text-gray-600">
                            Showing {filteredProducts.length} of{" "}
                            {products.total || products.data?.length || 0}{" "}
                            products
                        </p>
                        {isFiltering && (
                            <div className="flex items-center text-blue-600 text-sm">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 mr-2"></div>
                                Filtering...
                            </div>
                        )}
                    </div>
                </div>

                {/* Products Grid */}
                {filteredProducts && filteredProducts.length > 0 ? (
                    <>
                        <div
                            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8 transition-opacity duration-200 ${
                                isFiltering ? "opacity-50" : "opacity-100"
                            }`}
                        >
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.product_id}
                                    className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition group"
                                >
                                    {/* Clickable product image and content area */}
                                    <Link
                                        href={`/product/${product.product_id}`}
                                        className="block"
                                    >
                                        <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                                            {product.images &&
                                            product.images[0] ? (
                                                <img
                                                    src={`/storage/${product.images[0].image_path}`}
                                                    alt={product.product_title}
                                                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                            ) : (
                                                <div className="text-gray-400 text-4xl">
                                                    <img
                                                        src="/images/not-found-removebg-preview.png"
                                                        alt="no product"
                                                    />
                                                </div>
                                            )}

                                            {/* Stock badges */}
                                            {product.product_stock <= 5 &&
                                                product.product_stock > 0 && (
                                                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                                                        Only{" "}
                                                        {product.product_stock}{" "}
                                                        left
                                                    </span>
                                                )}

                                            {product.product_stock === 0 && (
                                                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                    Out of Stock
                                                </span>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Product details */}
                                    <div className="p-4">
                                        <Link
                                            href={`/product/${product.product_id}`}
                                        >
                                            <h3 className="font-semibold text-gray-900 text-lg mb-2 truncate hover:text-gray-700 transition-colors">
                                                {product.product_title}
                                            </h3>
                                        </Link>
                                        <p className="text-gray-600 text-sm mb-1">
                                            {product.brand?.brand_title}
                                        </p>
                                        <p className="text-gray-500 text-sm mb-3">
                                            {product.category?.name}
                                        </p>
                                        <p className="text-gray-700 font-bold text-xl mb-3">
                                            ${product.product_price}
                                        </p>

                                        {/* Add to Cart Button */}
                                        <button
                                            onClick={() =>
                                                handleAddToCart(product)
                                            }
                                            className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg group-hover:bg-blue-700 transition text-center"
                                        >
                                            <AiOutlineShoppingCart className="w-5 h-5" />
                                            <span className="font-semibold">
                                                {product.product_stock > 0
                                                    ? "Add to Cart"
                                                    : "Out of Stock"}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Note: Pagination disabled for client-side filtering */}
                        {/* For full pagination support, consider server-side filtering */}
                    </>
                ) : (
                    /* No Products Found */
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">
                            <img
                                src="/images/not_found-removebg-preview.png"
                                alt="No products found"
                                className="mx-auto max-w-xs"
                                onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display =
                                        "block";
                                }}
                            />
                            <div className="text-6xl hidden">📱</div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No products found
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {search || selectedCategory || selectedBrand
                                ? "Try adjusting your filters or search terms."
                                : "We're currently updating our inventory. Please check back soon!"}
                        </p>
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
