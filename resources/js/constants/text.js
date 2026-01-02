// Text Content
export const TEXT_CONTENT = {
    hero: {
        ctaButton: 'Shop Now',
    },
    features: {
        title: 'Why Choose OUR STORE?',
        subtitle: "We're committed to providing you with the best mobile phone shopping experience",
    },
    featuredProducts: {
        title: 'Featured Products',
        subtitle: 'Check out our products',
        viewAllButton: 'View All Products',
        viewDetailsButton: 'View Details',
        stockWarning: '{count}',
    },
    categories: {
        title: 'Shop by Category',
    },
    cta: {
        title: 'Ready to Find Your Perfect Phone?',
        subtitle: 'Join thousands of satisfied customers who trust Phone Shop for their mobile needs',
        browseButton: 'Browse Phones',
    },
};

// URL Paths
export const PATHS = {
    shop: '/shop',
    product: (id) => `/product/${id}`,
    category: (categoryId) => `/shop?category=${categoryId}`,
};

// Animation Configuration
export const ANIMATIONS = {
    brandSlider: {
        speed: 2, // pixels per frame
        interval: 30, // milliseconds
        itemWidth: 180, // pixels - updated for consistent spacing
        resetDistance: 1440, // 8 items * 180px
    },
    video: {
        transitionDelay: 100, // milliseconds
    },
};

// CSS Classes (for consistency)
export const STYLES = {
    brandLogo: 'h-12 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300',
    brandItem: 'brand-item',
    featureIcon: 'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
    button: {
        primary: 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold',
        secondary: 'bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition',
        hero: 'bg-white text-gray-900 px-6 py-3 sm:px-8 sm:py-4 lg:px-12 lg:py-4 rounded-xl text-base sm:text-lg font-semibold hover:bg-transparent hover:text-white border-2 border-white transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-gray-500 w-auto min-w-[120px] text-center',
    },
    video: {
        container: 'absolute inset-0 w-full h-full object-cover',
        style: {
            zIndex: 1,
            transform: 'translateZ(0)',
            willChange: 'transform',
        }
    }
}; 