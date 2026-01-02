import PublicLayout from "@/Layouts/PublicLayout";
import { Link, router, usePage } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import CardSwap, { Card } from "@/Components/CardSwap";
import { AiOutlineShoppingCart } from "react-icons/ai";
import { useDispatch } from "react-redux";
import { addItem } from "@/Pages/store/orderSlice";
import {
    BRAND_LOGOS,
    HERO_VIDEOS,
    FEATURES,
    TEXT_CONTENT,
    PATHS,
    STYLES,
    ANIMATIONS,
    getCategoryImage,
    getCategoryMetadata,
    CATEGORY_SETTINGS,
} from "@/constants";

export default function Home({ featuredProducts, categories, seo }) {
    // Video carousel state
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [videoLoading, setVideoLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(true);
    const videoRef = useRef(null);

    // Add page visibility state
    const [isPageVisible, setIsPageVisible] = useState(true);

    // Brand slider state
    const brandSliderRef = useRef(null);
    const [brandOffset, setBrandOffset] = useState(0);

    // Category carousel state
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const categoryCarouselRef = useRef(null);

    // Use videos from constants
    const videos = HERO_VIDEOS;

    // Auto-advance to next video when current video ends
    const handleVideoEnd = () => {
        const nextIndex =
            currentVideoIndex === videos.length - 1 ? 0 : currentVideoIndex + 1;
        setCurrentVideoIndex(nextIndex);
        setVideoLoading(true);
    };

    // Handle play/pause toggle
    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    // State to track if a video has failed to load
    const [videoError, setVideoError] = useState(false);

    // Handle video error
    const handleVideoError = () => {
        setVideoError(true);
        setVideoLoading(false);
    };

    // Handle page visibility changes (tab switching)
    useEffect(() => {
        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            setIsPageVisible(isVisible);

            if (videoRef.current) {
                if (isVisible) {
                    // Page became visible - try to resume video
                    if (!videoRef.current.paused) {
                        // Video was playing, ensure it continues
                        setVideoLoading(false);
                    } else {
                        // Video was paused, try to play it
                        setVideoLoading(true);
                        videoRef.current
                            .play()
                            .then(() => {
                                setIsPlaying(true);
                                setVideoLoading(false);
                            })
                            .catch(() => {
                                setVideoLoading(false);
                            });
                    }
                } else {
                    // Page became hidden - optionally pause video to save resources
                    videoRef.current.pause();
                    setIsPlaying(false);
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, []);

    // Reset video when index changes
    useEffect(() => {
        if (videoRef.current) {
            // Reset states for new video
            setVideoError(false);
            setVideoLoading(true);
            setIsPlaying(false);

            // Force reload the video element
            const video = videoRef.current;
            video.load();

            // Ensure muted for autoplay
            video.muted = true;
        }
    }, [currentVideoIndex]);

    // Brand slider auto-play effect
    useEffect(() => {
        const interval = setInterval(() => {
            setBrandOffset((prev) => {
                const newOffset = prev - ANIMATIONS.brandSlider.speed;
                // Reset when we've moved one full set
                if (
                    Math.abs(newOffset) >= ANIMATIONS.brandSlider.resetDistance
                ) {
                    return 0;
                }
                return newOffset;
            });
        }, ANIMATIONS.brandSlider.interval);

        return () => clearInterval(interval);
    }, []);

    // Category carousel functions
    const nextCategory = () => {
        if (categories.length > CATEGORY_SETTINGS.visibleCategories) {
            setCurrentCategoryIndex((prev) =>
                prev + CATEGORY_SETTINGS.visibleCategories >= categories.length
                    ? 0
                    : prev + 1
            );
        }
    };

    const prevCategory = () => {
        if (categories.length > CATEGORY_SETTINGS.visibleCategories) {
            setCurrentCategoryIndex((prev) =>
                prev === 0
                    ? Math.max(
                          0,
                          categories.length -
                              CATEGORY_SETTINGS.visibleCategories
                      )
                    : prev - 1
            );
        }
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

    // Category auto-scroll effect
    useEffect(() => {
        if (
            CATEGORY_SETTINGS.autoScroll.enabled &&
            categories.length > CATEGORY_SETTINGS.visibleCategories
        ) {
            const interval = setInterval(
                nextCategory,
                CATEGORY_SETTINGS.autoScroll.interval
            );
            return () => clearInterval(interval);
        }
    }, [categories.length]);

    return (
        <PublicLayout seo={seo}>
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-gray-100">
                {/* Video Background Container */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                    {/* Video Element */}
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                            zIndex: 1,
                            transform: "translateZ(0)", // Force hardware acceleration
                            willChange: "transform", // Optimize for changes
                        }}
                        src={videos[currentVideoIndex].src}
                        onEnded={handleVideoEnd}
                        onError={handleVideoError}
                        onCanPlay={() => {
                            setVideoLoading(false);
                            setVideoError(false);
                            // Auto-play when ready and page is visible
                            if (isPageVisible) {
                                setTimeout(() => {
                                    if (videoRef.current) {
                                        videoRef.current
                                            .play()
                                            .then(() => {
                                                setIsPlaying(true);
                                            })
                                            .catch(() => {
                                                // Autoplay blocked - user can click play button
                                            });
                                    }
                                }, 100);
                            }
                        }}
                        onLoadedData={() => {
                            setVideoLoading(false);
                        }}
                        onPlay={() => {
                            setIsPlaying(true);
                        }}
                        onPause={() => setIsPlaying(false)}
                        onWaiting={() => {
                            // Video is buffering - show loading
                            setVideoLoading(true);
                        }}
                        onPlaying={() => {
                            // Video resumed playing - hide loading
                            setVideoLoading(false);
                        }}
                        muted
                        playsInline
                        autoPlay
                        preload="auto"
                    />

                    {/* Loading indicator - show during transitions OR when page not visible */}
                    {(videoLoading || !isPageVisible) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10 rounded-3xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        </div>
                    )}

                    {/* Fallback background for when video fails */}
                    {videoError && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-purple-900 z-0 rounded-3xl" />
                    )}

                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-3xl"></div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-6 sm:bottom-8 lg:bottom-10 left-1/2 transform -translate-x-1/2 z-20 px-4 w-full max-w-xs sm:max-w-none sm:w-auto">
                        <Link href={PATHS.shop} className={STYLES.button.hero}>
                            {TEXT_CONTENT.hero.ctaButton}
                        </Link>
                    </div>

                    {/* Custom Play/Pause Button */}
                    <div className="absolute top-6 right-6 z-20">
                        <button
                            onClick={togglePlayPause}
                            className="w-14 h-14 bg-gray-500 rounded-full flex items-center justify-center hover:bg-gray-700 transition-all duration-200"
                        >
                            {isPlaying ? (
                                // Pause icon
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                </svg>
                            ) : (
                                // Play icon
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* Brands Section */}
            <section className="py-12 bg-gray-50 border-y border-gray-200">
                <div className="w-full overflow-hidden">
                    {/* Infinite Scrolling Brands */}
                    <div className="relative">
                        <style
                            dangerouslySetInnerHTML={{
                                __html: `
                            .brand-item {
                                width: 180px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                flex-shrink: 0;
                                padding: 0 20px;
                            }
                            .brand-logo {
                                max-width: 140px;
                                height: 48px;
                                object-fit: contain;
                                opacity: 0.7;
                                transition: opacity 0.3s ease;
                            }
                            .brand-logo:hover {
                                opacity: 1;
                            }
                        `,
                            }}
                        ></style>

                        <div
                            ref={brandSliderRef}
                            className="flex transition-none"
                            style={{
                                transform: `translateX(${brandOffset}px)`,
                                width: "calc(200%)",
                            }}
                        >
                            {/* First set */}
                            {BRAND_LOGOS.map((brand, index) => (
                                <div
                                    key={`first-${brand.id}`}
                                    className="brand-item"
                                >
                                    <img
                                        src={brand.src}
                                        alt={brand.alt}
                                        className="brand-logo"
                                    />
                                </div>
                            ))}

                            {/* Duplicate set for seamless loop */}
                            {BRAND_LOGOS.map((brand, index) => (
                                <div
                                    key={`duplicate-${brand.id}`}
                                    className="brand-item"
                                >
                                    <img
                                        src={brand.src}
                                        alt={brand.alt}
                                        className="brand-logo"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Section - Redesigned */}
            {categories && categories.length > 0 && (
                <section className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">
                                {TEXT_CONTENT.categories.title}
                            </h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                Discover our wide range of products across
                                different categories
                            </p>
                        </div>

                        {/* Categories Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map((category) => {
                                const categoryImage = getCategoryImage(
                                    category.name
                                );
                                const categoryMeta = getCategoryMetadata(
                                    category.name
                                );

                                return (
                                    <Link
                                        key={category.id}
                                        href={PATHS.category(category.id)}
                                        className="group relative bg-white rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                                    >
                                        {/* Image Container */}
                                        <div className="aspect-square relative overflow-hidden">
                                            <img
                                                src={categoryImage}
                                                alt={category.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                            {/* Product Count Badge */}
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-700 shadow-md">
                                                {category.products_count || 0}{" "}
                                                Items
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                {category.name}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-4">
                                                {category.products_count || 0}{" "}
                                                products in this category
                                            </p>
                                        </div>

                                        {/* Hover Effect Overlay */}
                                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 lg:items-center">
                        {/* Cards First on Mobile */}
                        <div className="flex items-center justify-center w-full h-[200px] sm:h-[280px] lg:h-[500px] lg:order-2">
                            <div className="relative w-[220px] sm:w-[300px] lg:w-[480px] h-[160px] sm:h-[220px] lg:h-[360px] flex items-center justify-center">
                                <CardSwap
                                    cardDistance={30}
                                    verticalDistance={40}
                                    delay={5000}
                                    pauseOnHover={true}
                                    width="100%"
                                    height="100%"
                                >
                                    {FEATURES.map((feature) => (
                                        <Card
                                            key={feature.id}
                                            customClass="bg-white border-gray-200 shadow-lg"
                                        >
                                            <div className="p-3 sm:p-5 lg:p-8 text-center h-full flex flex-col justify-center">
                                                <img
                                                    src={feature.icon}
                                                    alt={feature.title}
                                                    className="w-8 h-8 sm:w-12 sm:h-12 lg:w-32 lg:h-32 object-contain mx-auto mb-2 sm:mb-3 lg:mb-6"
                                                />
                                                <h3 className="text-xs sm:text-sm lg:text-2xl font-semibold mb-1 sm:mb-2 lg:mb-4 text-gray-900 leading-tight">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-gray-600 text-[10px] sm:text-xs lg:text-base leading-tight">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </Card>
                                    ))}
                                </CardSwap>
                            </div>
                        </div>

                        {/* Text Second on Mobile */}
                        <div className="text-center lg:text-left lg:order-1">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                                {TEXT_CONTENT.features.title}
                            </h2>
                            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                                {TEXT_CONTENT.features.subtitle}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            {TEXT_CONTENT.featuredProducts.title}
                        </h2>
                        <p className="text-gray-600">
                            {TEXT_CONTENT.featuredProducts.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {featuredProducts.map((product) => (
                            <div
                                key={product.product_id}
                                className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition group"
                            >
                                {/* Clickable product image */}
                                <Link
                                    href={PATHS.product(product.product_id)}
                                    className="block"
                                >
                                    <div className="h-48 bg-gray-200 flex items-center justify-center relative overflow-hidden">
                                        {product.images && product.images[0] ? (
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
                                                    Only {product.product_stock}{" "}
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
                                        href={PATHS.product(product.product_id)}
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
                                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg group-hover:bg-blue-700 transition text-center"
                                        onClick={() => handleAddToCart(product)}
                                        disabled={product.product_stock === 0}
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

                    <div className="text-center mt-12">
                        <Link
                            href={PATHS.shop}
                            className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transform hover:-translate-y-0.5 transition-all duration-200"
                        >
                            <span>View All Products</span>
                            <svg
                                className="w-5 h-5 ml-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
