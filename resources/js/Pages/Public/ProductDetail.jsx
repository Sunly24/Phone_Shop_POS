import PublicLayout from "@/Layouts/PublicLayout";
import { Link } from "@inertiajs/react";
import { useState } from "react";
import {
    AiOutlineShoppingCart,
    AiOutlineLeft,
    AiOutlineRight,
} from "react-icons/ai";
import { useDispatch } from "react-redux";
import { addItem } from "@/Pages/store/orderSlice";
import { usePage, router } from "@inertiajs/react";

import {
    generateProductSchema,
    generateBreadcrumbSchema,
} from "@/Utils/seoUtils";

export default function ProductDetail({ product, relatedProducts = [], seo }) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const images =
        product.images && product.images.length > 0 ? product.images : [];

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(price);
    };

    const nextImage = () => {
        if (images.length > 0) {
            setSelectedImageIndex((prev) => (prev + 1) % images.length);
        }
    };

    const prevImage = () => {
        if (images.length > 0) {
            setSelectedImageIndex(
                (prev) => (prev - 1 + images.length) % images.length
            );
        }
    };

    const dispatch = useDispatch();
    const { auth } = usePage().props;

    const handleAddToCart = () => {
        if (!auth?.user) {
            router.visit("/login");
            return;
        }
        dispatch(addItem(product));
    };

    // Enhanced SEO data
    const productImage = images[selectedImageIndex]
        ? `/storage/${images[selectedImageIndex].image_path}`
        : "/images/og-default.jpg";

    const breadcrumbs = [
        { name: "Home", url: "/" },
        { name: "Shop", url: "/shop" },
        { name: product.product_title, url: `/product/${product.product_id}` },
    ];

    const enhancedSEO = {
        ...seo,
        title: `${product.product_title} - ${
            product.brand?.brand_title || "JongBan Store"
        }`,
        description:
            product.product_description ||
            `Buy ${product.product_title} at the best price. Premium quality ${
                product.brand?.brand_title || "mobile"
            } phone with warranty.`,
        keywords: `${product.product_title}, ${
            product.brand?.brand_title || "mobile phone"
        }, smartphone, phone shop, jong ban store, ${
            product.category?.name || "electronics"
        }`,
        image: productImage,
        type: "product",
        price: product.product_price,
        currency: "USD",
        availability: product.product_stock > 0 ? "InStock" : "OutOfStock",
        brand: product.brand?.brand_title,
        model: product.product_title,
        condition: "new",
        productId: product.product_id,
        breadcrumbs: breadcrumbs,
        structured_data: generateProductSchema(product),
        canonical: `/product/${product.product_id}`,
        modifiedTime: product.updated_at,
        publishedTime: product.created_at,
    };

    return (
        <PublicLayout seo={enhancedSEO}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav
                    className="flex text-sm text-gray-600 mb-8"
                    aria-label="Breadcrumb"
                >
                    <Link href="/" className="hover:text-blue-600">
                        Home
                    </Link>
                    <span className="mx-2">/</span>
                    <Link href="/shop" className="hover:text-blue-600">
                        Shop
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900" aria-current="page">
                        {product.product_title}
                    </span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Product Images */}
                    <div className="space-y-4">
                        {images.length > 0 ? (
                            <>
                                {/* Main Image */}
                                <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
                                    <img
                                        src={`/storage/${images[selectedImageIndex].image_path}`}
                                        alt={`${
                                            product.product_title
                                        } - Image ${selectedImageIndex + 1}`}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                    {images.length > 1 && (
                                        <>
                                            {/* Previous Button */}
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                                                aria-label="Previous image"
                                            >
                                                <AiOutlineLeft className="w-5 h-5 text-gray-700" />
                                            </button>
                                            {/* Next Button */}
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                                                aria-label="Next image"
                                            >
                                                <AiOutlineRight className="w-5 h-5 text-gray-700" />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Thumbnail Images */}
                                {images.length > 1 && (
                                    <div className="flex space-x-2 overflow-x-auto pb-2">
                                        {images.map((image, index) => (
                                            <button
                                                key={`thumbnail-${index}-${image
                                                    .split("/")
                                                    .pop()}`}
                                                onClick={() =>
                                                    setSelectedImageIndex(index)
                                                }
                                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                                                    index === selectedImageIndex
                                                        ? "border-blue-500"
                                                        : "border-gray-200"
                                                }`}
                                                aria-label={`View image ${
                                                    index + 1
                                                }`}
                                            >
                                                <img
                                                    src={`/storage/${image.image_path}`}
                                                    alt={`${
                                                        product.product_title
                                                    } thumbnail ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="aspect-square bg-gray-200 rounded-2xl flex items-center justify-center">
                                <span className="text-gray-500">
                                    No image available
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Product Details */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            {product.product_title}
                        </h1>

                        {/* Brand and Category */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
                            {product.brand && (
                                <span className="bg-gray-100 px-3 py-1 rounded-full">
                                    <strong>Brand:</strong>{" "}
                                    {product.brand.brand_title}
                                </span>
                            )}
                            {product.category && (
                                <span className="bg-gray-100 px-3 py-1 rounded-full">
                                    <strong>Category:</strong>{" "}
                                    {product.category.name}
                                </span>
                            )}
                        </div>

                        {/* Price */}
                        <div className="mb-6">
                            <p className="text-3xl font-bold text-blue-600">
                                {formatPrice(product.product_price)}
                            </p>
                        </div>

                        {/* Stock Status */}
                        <div className="mb-6">
                            <div className="flex items-center space-x-2">
                                <div
                                    className={`w-3 h-3 rounded-full ${
                                        product.product_stock > 0
                                            ? "bg-green-500"
                                            : "bg-red-500"
                                    }`}
                                ></div>
                                <span
                                    className={`font-medium ${
                                        product.product_stock > 0
                                            ? "text-green-700"
                                            : "text-red-700"
                                    }`}
                                >
                                    {product.product_stock > 0
                                        ? `In Stock (${product.product_stock} available)`
                                        : "Out of Stock"}
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        {product.product_description && (
                            <div className="mb-8">
                                <h2 className="text-xl font-semibold mb-3">
                                    Description
                                </h2>
                                <p className="text-gray-700 leading-relaxed">
                                    {product.product_description}
                                </p>
                            </div>
                        )}

                        {/* Specifications */}
                        <div className="mb-8">
                            <h2 className="text-xl font-semibold mb-3">
                                Specifications
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {product.product_code && (
                                    <div className="bg-gray-50 rounded-lg">
                                        <span className="font-medium">
                                            Product Code:
                                        </span>{" "}
                                        <span className="text-gray-700">
                                            {product.product_code}
                                        </span>
                                    </div>
                                )}
                                {product.maker && (
                                    <div className="bg-gray-50 rounded-lg">
                                        <span className="font-medium">
                                            Manufacturer:
                                        </span>{" "}
                                        <span className="text-gray-700">
                                            {product.maker.maker_title}
                                        </span>
                                    </div>
                                )}
                                {product.product_ram && (
                                    <div className="bg-gray-50 rounded-lg">
                                        <span className="font-medium">
                                            RAM:
                                        </span>{" "}
                                        <span className="text-gray-700">
                                            {product.product_ram}
                                        </span>
                                    </div>
                                )}
                                {product.product_storage && (
                                    <div className="bg-gray-50 rounded-lg">
                                        <span className="font-medium">
                                            Storage:
                                        </span>{" "}
                                        <span className="text-gray-700">
                                            {product.product_storage}
                                        </span>
                                    </div>
                                )}
                                {product.color && (
                                    <div className="bg-gray-50 rounded-lg">
                                        <span className="font-medium">
                                            Color:
                                        </span>{" "}
                                        <span className="text-gray-700">
                                            {product.color.color_title}
                                        </span>
                                    </div>
                                )}
                                {product.size && (
                                    <div className="bg-gray-50 rounded-lg">
                                        <span className="font-medium">
                                            Size:
                                        </span>{" "}
                                        <span className="text-gray-700">
                                            {product.size.size_title}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4 mb-8">
                            <button
                                disabled={product.product_stock === 0}
                                onClick={handleAddToCart}
                                className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                    product.product_stock > 0
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                                aria-label={`Add ${product.product_title} to cart`}
                            >
                                <AiOutlineShoppingCart className="w-5 h-5" />
                                <span>Add to Cart</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-2xl font-bold mb-8">
                            You might also like
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {relatedProducts.map((relatedProduct) => (
                                <div
                                    key={relatedProduct.product_id}
                                    className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition group"
                                >
                                    <Link
                                        href={`/product/${relatedProduct.product_id}`}
                                        className="block"
                                    >
                                        <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                                            {relatedProduct.images?.[0] ? (
                                                <img
                                                    src={`/storage/${relatedProduct.images[0].image_path}`}
                                                    alt={
                                                        relatedProduct.product_title
                                                    }
                                                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                                                    loading="lazy"
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
                                            {relatedProduct.product_stock <=
                                                5 &&
                                                relatedProduct.product_stock >
                                                    0 && (
                                                    <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                                                        Only{" "}
                                                        {
                                                            relatedProduct.product_stock
                                                        }{" "}
                                                        left
                                                    </span>
                                                )}

                                            {relatedProduct.product_stock ===
                                                0 && (
                                                <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                    Out of Stock
                                                </span>
                                            )}
                                        </div>
                                    </Link>

                                    <div className="p-4">
                                        <Link
                                            href={`/product/${relatedProduct.product_id}`}
                                        >
                                            <h3 className="font-semibold text-lg mb-2 truncate hover:text-blue-600">
                                                {relatedProduct.product_title}
                                            </h3>
                                        </Link>
                                        <p className="text-gray-600 text-sm mb-1">
                                            {relatedProduct.brand?.brand_title}
                                        </p>
                                        <p className="text-gray-500 text-sm mb-3">
                                            {relatedProduct.category?.name}
                                        </p>
                                        <p className="text-blue-600 font-bold text-xl mb-3">
                                            {formatPrice(
                                                relatedProduct.product_price
                                            )}
                                        </p>

                                        {/* Add to Cart Button */}
                                        <button className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg group-hover:bg-blue-700 transition text-center">
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
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
