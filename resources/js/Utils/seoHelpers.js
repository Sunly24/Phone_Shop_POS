/**
 * SEO Helper Functions for Phone Shop
 * Generate structured data and SEO-optimized content
 */

/**
 * Generate Product structured data for phones
 */
export function generateProductStructuredData({
    name,
    description,
    image,
    price,
    currency = 'USD',
    brand,
    model,
    sku,
    availability = 'InStock',
    condition = 'NewCondition',
    url,
    siteName = 'JB STORE',
    rating = 4.8,
    reviewCount = 127,
    features = []
}) {
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": name,
        "description": description,
        "image": Array.isArray(image) ? image : [image],
        "brand": {
            "@type": "Brand",
            "name": brand
        },
        "model": model,
        "sku": sku,
        "productID": sku,
        "category": "Electronics > Mobile Phones",
        "offers": {
            "@type": "Offer",
            "url": url,
            "priceCurrency": currency,
            "price": price,
            "availability": `https://schema.org/${availability}`,
            "itemCondition": `https://schema.org/${condition}`,
            "seller": {
                "@type": "Organization",
                "name": siteName
            },
            "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": rating,
            "reviewCount": reviewCount,
            "bestRating": 5,
            "worstRating": 1
        },
        "additionalProperty": features.map(feature => ({
            "@type": "PropertyValue",
            "name": feature.name,
            "value": feature.value
        }))
    };
}

/**
 * Generate Organization structured data
 */
export function generateOrganizationStructuredData({
    name = 'Phone Shop',
    url = 'https://yourphoneshop.com',
    logo = '/images/logo.png',
    description = 'Professional phone shop with premium mobile phones and exceptional service.',
    address = {
        streetAddress: '123 Tech Street',
        addressLocality: 'Tech City',
        addressRegion: 'TC',
        postalCode: '12345',
        addressCountry: 'US'
    },
    phone = '+1-555-123-4567',
    email = 'info@yourphoneshop.com',
    socialMedia = []
}) {
    return {
        "@context": "https://schema.org",
        "@type": ["Organization", "LocalBusiness", "Store"],
        "name": name,
        "description": description,
        "url": url,
        "logo": {
            "@type": "ImageObject",
            "url": logo
        },
        "image": logo,
        "address": {
            "@type": "PostalAddress",
            ...address
        },
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "telephone": phone,
                "email": email,
                "contactType": "customer service",
                "availableLanguage": ["English"]
            }
        ],
        "sameAs": socialMedia,
        "openingHours": [
            "Mo-Fr 09:00-18:00",
            "Sa 10:00-16:00"
        ],
        "priceRange": "$$",
        "paymentAccepted": ["Cash", "Credit Card", "Debit Card", "PayPal"],
        "currenciesAccepted": "USD"
    };
}

/**
 * Generate Breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(breadcrumbs) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": crumb.name,
            "item": crumb.url
        }))
    };
}

/**
 * Generate FAQ structured data
 */
export function generateFAQStructuredData(faqs) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

/**
 * Generate WebSite structured data with search functionality
 */
export function generateWebsiteStructuredData({
    name = 'Phone Shop',
    url = 'https://yourphoneshop.com',
    description = 'Professional phone shop with premium mobile phones and exceptional service.'
}) {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": name,
        "description": description,
        "url": url,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${url}/shop?search={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    };
}

/**
 * Generate optimized meta description for products
 */
export function generateProductMetaDescription({
    productName,
    brand,
    price,
    currency = 'USD',
    features = []
}) {
    const featuresText = features.length > 0 ? ` Features: ${features.slice(0, 3).join(', ')}.` : '';
    return `${brand} ${productName} - ${currency}${price}. Premium quality mobile phone with exceptional performance.${featuresText} Buy now with fast shipping and warranty.`.substring(0, 160);
}

/**
 * Generate optimized title for products
 */
export function generateProductTitle({
    productName,
    brand,
    model,
    siteName = 'Phone Shop'
}) {
    const title = `${brand} ${productName}${model ? ` ${model}` : ''} | ${siteName}`;
    return title.length <= 60 ? title : `${brand} ${productName} | ${siteName}`;
}

/**
 * Generate keywords for products
 */
export function generateProductKeywords({
    brand,
    model,
    category = 'smartphone',
    features = []
}) {
    const baseKeywords = [
        `${brand.toLowerCase()} ${model?.toLowerCase() || ''}`,
        `${brand.toLowerCase()} ${category}`,
        `buy ${brand.toLowerCase()}`,
        `${brand.toLowerCase()} phone`,
        category,
        'mobile phone',
        'smartphone',
        'phone store'
    ];
    
    const featureKeywords = features.map(f => f.toLowerCase());
    
    return [...baseKeywords, ...featureKeywords].filter(Boolean).join(', ');
}

/**
 * Common phone shop FAQs
 */
export const PHONE_SHOP_FAQS = [
    {
        question: "Do you offer warranty on mobile phones?",
        answer: "Yes, we offer manufacturer warranty on all new phones and our own warranty on refurbished devices. Warranty periods vary by product and are clearly stated on each product page."
    },
    {
        question: "Do you provide phone repair services?",
        answer: "Yes, we offer comprehensive phone repair services including screen replacement, battery replacement, and software troubleshooting for all major brands."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, debit cards, PayPal, and cash for in-store purchases. We also offer financing options for qualified customers."
    },
    {
        question: "Do you buy used phones?",
        answer: "Yes, we purchase used phones in good condition. We offer competitive prices based on the device model, condition, and current market value."
    },
    {
        question: "Do you offer phone insurance?",
        answer: "Yes, we partner with leading insurance providers to offer comprehensive phone insurance plans that cover damage, theft, and loss."
    }
];
