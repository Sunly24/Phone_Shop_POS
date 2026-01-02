// SEO utility functions

/**
 * Generate SEO-friendly URL slug from title
 * @param {string} title - The title to convert
 * @returns {string} - SEO-friendly slug
 */
export function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/--+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
}

/**
 * Generate meta description from content
 * @param {string} content - The content to extract description from
 * @param {number} maxLength - Maximum length of description
 * @returns {string} - Meta description
 */
export function generateMetaDescription(content, maxLength = 160) {
    const cleanContent = content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\s+/g, ' ') // Replace multiple spaces with single
        .trim();
    
    if (cleanContent.length <= maxLength) {
        return cleanContent;
    }
    
    return cleanContent.substring(0, maxLength - 3) + '...';
}

/**
 * Generate keywords from content
 * @param {string} content - The content to extract keywords from
 * @param {number} maxKeywords - Maximum number of keywords
 * @returns {string} - Comma-separated keywords
 */
export function generateKeywords(content, maxKeywords = 10) {
    const words = content
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .split(/\s+/)
        .filter(word => word.length > 3) // Only words longer than 3 characters
        .filter(word => !commonWords.includes(word)); // Remove common words
    
    // Get unique words and their frequency
    const wordFreq = {};
    words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Sort by frequency and take top keywords
    const sortedWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, maxKeywords)
        .map(([word]) => word);
    
    return sortedWords.join(', ');
}

/**
 * Common words to exclude from keywords
 */
const commonWords = [
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these',
    'those', 'i', 'me', 'my', 'mine', 'myself', 'you', 'your', 'yours',
    'yourself', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
    'herself', 'it', 'its', 'itself', 'we', 'us', 'our', 'ours', 'ourselves',
    'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'
];

/**
 * Generate structured data for products
 * @param {Object} product - Product data
 * @returns {Object} - Structured data object
 */
export function generateProductSchema(product) {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.product_title,
        description: product.product_description,
        image: product.images?.[0] ? `/storage/${product.images[0].image_path}` : null,
        brand: {
            "@type": "Brand",
            name: product.brand?.brand_title || "JongBan Store"
        },
        offers: {
            "@type": "Offer",
            url: `/product/${product.product_id}`,
            priceCurrency: "USD",
            price: product.product_price,
            availability: product.product_stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: {
                "@type": "Organization",
                name: "JongBan Phone Store"
            }
        },
        aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: "127"
        }
    };
}

/**
 * Generate breadcrumb structured data
 * @param {Array} breadcrumbs - Array of breadcrumb objects
 * @returns {Object} - Breadcrumb structured data
 */
export function generateBreadcrumbSchema(breadcrumbs) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: crumb.url
        }))
    };
}

/**
 * Generate FAQ structured data
 * @param {Array} faqs - Array of FAQ objects
 * @returns {Object} - FAQ structured data
 */
export function generateFAQSchema(faqs) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map(faq => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer
            }
        }))
    };
}

/**
 * Generate Open Graph image URL
 * @param {string} title - Title for the image
 * @param {string} description - Description for the image
 * @returns {string} - Dynamic OG image URL
 */
export function generateOGImage(title, description = '') {
    // You can implement a dynamic OG image generator here
    // For now, return the default image
    return '/images/og-default.jpg';
}

/**
 * Validate and sanitize SEO data
 * @param {Object} seoData - SEO data to validate
 * @returns {Object} - Sanitized SEO data
 */
export function sanitizeSEOData(seoData) {
    const sanitized = {};
    
    // Title validation
    if (seoData.title) {
        sanitized.title = seoData.title.substring(0, 60).trim();
    }
    
    // Description validation
    if (seoData.description) {
        sanitized.description = seoData.description.substring(0, 160).trim();
    }
    
    // Keywords validation
    if (seoData.keywords) {
        const keywords = seoData.keywords.split(',').map(k => k.trim()).slice(0, 10);
        sanitized.keywords = keywords.join(', ');
    }
    
    // URL validation
    if (seoData.url) {
        try {
            new URL(seoData.url);
            sanitized.url = seoData.url;
        } catch (e) {
            // Invalid URL, skip
        }
    }
    
    return sanitized;
}

/**
 * Generate hreflang alternatives for multilingual sites
 * @param {string} currentUrl - Current page URL
 * @param {Array} languages - Array of language codes
 * @returns {Array} - Array of hreflang objects
 */
export function generateHreflangAlternatives(currentUrl, languages = ['en', 'km', 'zh']) {
    const baseUrl = currentUrl.split('?')[0]; // Remove query parameters
    
    return languages.map(lang => ({
        code: lang,
        url: `${baseUrl}?lang=${lang}`
    }));
} 