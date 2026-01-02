// Category Images and Metadata
export const CATEGORY_IMAGES = {
    // Default images for categories
    default: '/images/categories/phone.jpg',
    
    // Phone-related categories using storage images
    phones: '/images/categories/phone.jpg',
    smartphones: '/images/categories/phone.jpg',
    smartphone: '/images/categories/phone.jpg', // Added for "SmartPhone"
    mobile: '/images/categories/phone.jpg',
    
    // Audio categories
    headphones: '/images/categories/headphone.png',
    headphone: '/images/categories/headphone.png', // Added for "HeadPhone"
    earphones: '/images/categories/earphone.jpg',
    earbuds: '/images/categories/earphone.jpg',
    
    cases: '/images/categories/accessories.jpg',
    case: '/images/categories/accessories.jpg',
    chargers: '/images/categories/accessories.jpg',
    speakers: '/images/categories/speakers.webp',
    cables: '/images/categories/accessories.jpg',
    accessories: '/images/categories/accessories.jpg',
};

// Get category image by name with fallback
export const getCategoryImage = (categoryName) => {
    if (!categoryName) return CATEGORY_IMAGES.default;
    
    const normalizedName = categoryName.toLowerCase().trim();
    return CATEGORY_IMAGES[normalizedName] || CATEGORY_IMAGES.default;
};

// Category display settings
export const CATEGORY_SETTINGS = {
    // Number of categories to show at once in the carousel
    visibleCategories: 4,
    
    // Responsive breakpoints for category grid
    responsive: {
        mobile: 1,      // 1 category on mobile
        tablet: 2,      // 2 categories on tablet
        desktop: 4      // 4 categories on desktop
    },
    
    // Auto-scroll settings
    autoScroll: {
        enabled: true,
        interval: 5000, // 5 seconds
        pauseOnHover: true
    }
};

// Category metadata for enhanced display
export const CATEGORY_METADATA = {
   
   
    phones: {
        description: 'Latest smartphones and mobile devices',
        gradient: 'from-green-500 to-blue-600'
    },
    smartphones: {
        description: 'Latest smartphones and mobile devices',
        gradient: 'from-green-500 to-blue-600'
    },
    smartphone: {
        description: 'Latest smartphones and mobile devices',
        gradient: 'from-green-500 to-blue-600'
    },
    headphones: {
        description: 'Latest headphones and audio devices',
        gradient: 'from-purple-500 to-pink-600'
    },
    headphone: {
        description: 'Latest headphones and audio devices',
        gradient: 'from-purple-500 to-pink-600'
    },
    cases: {
        description: 'Latest phone cases and accessories',
        gradient: 'from-red-500 to-orange-600'
    },
    case: {
        description: 'Latest phone cases and accessories',
        gradient: 'from-red-500 to-orange-600'
    },
    chargers: {
        description: 'Latest phone chargers and accessories',
        gradient: 'from-yellow-500 to-green-600'
    },
    earphones: {
        description: 'Latest earphones and audio devices',
        gradient: 'from-blue-500 to-indigo-600'
    },
    speakers: {
        description: 'Latest speakers and audio devices',
        gradient: 'from-indigo-500 to-purple-600'
    },
    cables: {
        description: 'Latest cables and accessories',
        gradient: 'from-pink-500 to-purple-600'
    }
};

// Get category metadata with fallback
export const getCategoryMetadata = (categoryName) => {
    if (!categoryName) return { description: 'Explore our products', gradient: 'from-gray-500 to-gray-600' };
    
    const normalizedName = categoryName.toLowerCase().trim();
    return CATEGORY_METADATA[normalizedName] || { 
        description: `Browse ${categoryName} collection`, 
        gradient: 'from-blue-500 to-purple-600' 
    };
}; 