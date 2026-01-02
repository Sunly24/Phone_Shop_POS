import { Head } from "@inertiajs/react";

export default function SEO({
    title = "ចង់បាន-JongBan Phone Store",
    description = "Professional phone shop with premium mobile phones and exceptional service.",
    keywords = "phone shop, Jong Ban Store, mobile phones, smartphones, iPhone, Samsung, phone store, Jong Ban Shop, Jong Ban, JongBan, Jongban",
    image = "/images/og-default.jpg",
    url = null,
    type = "website",
    siteName = "ចង់បាន-JongBan Phone Store",
    locale = "en_US",
    canonical = null,
    noindex = false,
    nofollow = false,
    structured_data = null,
    breadcrumbs = null,
    alternateLanguages = null,
    lastModified = null,
    price = null,
    currency = "USD",
    availability = null,
    brand = null,
    model = null,
    condition = "new",
    productId = null,
    // New props for enhanced SEO
    businessAddress = null,
    businessPhone = null,
    businessEmail = null,
    businessHours = null,
    faqData = null,
    reviewData = null,
    priceRange = null,
    publishedTime = null,
    modifiedTime = null,
    author = null,
    section = null,
    tags = null,
    videoData = null,
    articleData = null,
}) {
    const fullTitle = title ? `${title}` : siteName;
    const currentUrl =
        url || (typeof window !== "undefined" ? window.location.href : "");

    // Default business info (you should customize these)
    const defaultBusiness = {
        name: siteName,
        address: businessAddress || "Phnom Penh, Cambodia",
        phone: businessPhone || "+855-XX-XXX-XXX",
        email: businessEmail || "info@jongban.com",
        url: currentUrl || "https://jongban.e-khmer.com",
        hours: businessHours || "Mo-Su 08:00-20:00",
        priceRange: priceRange || "$$",
    };

    return (
        <Head>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Enhanced Meta Tags */}
            <meta name="application-name" content={siteName} />
            <meta name="apple-mobile-web-app-title" content={siteName} />
            <meta name="msapplication-tooltip" content={description} />

            {/* Author and Publication Info */}
            {author && <meta name="author" content={author} />}
            {publishedTime && (
                <meta name="article:published_time" content={publishedTime} />
            )}
            {modifiedTime && (
                <meta name="article:modified_time" content={modifiedTime} />
            )}
            {section && <meta name="article:section" content={section} />}
            {tags && <meta name="article:tag" content={tags} />}

            {/* Favicon and Icons */}
            <link rel="icon" href="/favicon.ico" />
            <link rel="shortcut icon" href="/favicon.ico" />
            <link
                rel="apple-touch-icon"
                sizes="180x180"
                href="/images/brand-logo/white-logo.png"
            />
            <link
                rel="icon"
                type="image/png"
                sizes="32x32"
                href="/images/brand-logo/white-logo.png"
            />
            <link
                rel="icon"
                type="image/png"
                sizes="16x16"
                href="/images/brand-logo/white-logo.png"
            />
            <link
                rel="mask-icon"
                href="/images/brand-logo/white-logo.png"
                color="#2563eb"
            />

            {/* Web App Manifest */}
            <link rel="manifest" href="/manifest.json" />

            {/* Robots */}
            <meta
                name="robots"
                content={`${noindex ? "noindex" : "index"},${
                    nofollow ? "nofollow" : "follow"
                }`}
            />
            <meta name="googlebot" content="index,follow" />
            <meta name="bingbot" content="index,follow" />

            {/* Canonical URL */}
            {canonical && <link rel="canonical" href={canonical} />}

            {/* Last Modified */}
            {lastModified && (
                <meta httpEquiv="last-modified" content={lastModified} />
            )}

            {/* Language Alternates */}
            {alternateLanguages &&
                alternateLanguages.map((lang, index) => (
                    <link
                        key={`alternate-${lang.code}-${index}`}
                        rel="alternate"
                        hrefLang={lang.code}
                        href={lang.url}
                    />
                ))}

            {/* Performance Hints */}
            <link rel="dns-prefetch" href="//fonts.googleapis.com" />
            <link rel="dns-prefetch" href="//fonts.gstatic.com" />
            <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            />
            <link rel="preconnect" href="https://cdnjs.cloudflare.com" />

            {/* Preload critical resources */}
            <link
                rel="preload"
                href="/images/brand-logo/blue-logo.png"
                as="image"
            />
            <link rel="preload" href="/images/og-default.jpg" as="image" />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:image" content={image} />
            <meta property="og:image:alt" content={`${fullTitle} - Image`} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content={locale} />
            <meta
                property="og:updated_time"
                content={modifiedTime || new Date().toISOString()}
            />

            {/* Product specific Open Graph */}
            {price && <meta property="og:price:amount" content={price} />}
            {currency && (
                <meta property="og:price:currency" content={currency} />
            )}
            {availability && (
                <meta property="og:availability" content={availability} />
            )}
            {brand && <meta property="og:brand" content={brand} />}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:image:alt" content={`${fullTitle} - Image`} />
            <meta name="twitter:creator" content="@jongbanstore" />
            <meta name="twitter:site" content="@jongbanstore" />

            {/* Business/E-commerce specific meta */}
            <meta name="rating" content="4.8" />
            <meta name="distribution" content="global" />
            <meta name="revisit-after" content="7 days" />
            <meta name="classification" content="business" />
            <meta name="category" content="Electronics, Mobile Phones" />
            <meta name="coverage" content="Worldwide" />
            <meta name="target" content="all" />
            <meta name="HandheldFriendly" content="True" />
            <meta name="MobileOptimized" content="320" />

            {/* Geographic Meta Tags */}
            <meta name="geo.region" content="KH" />
            <meta name="geo.country" content="Cambodia" />
            <meta name="geo.placename" content="Phnom Penh" />
            <meta name="ICBM" content="11.5564,104.9282" />

            {/* Product specific meta */}
            {brand && <meta name="product:brand" content={brand} />}
            {model && <meta name="product:model" content={model} />}
            {condition && <meta name="product:condition" content={condition} />}
            {price && (
                <meta name="product:price" content={`${price} ${currency}`} />
            )}
            {availability && (
                <meta name="product:availability" content={availability} />
            )}

            {/* Additional Meta */}
            <meta
                name="viewport"
                content="width=device-width, initial-scale=1, shrink-to-fit=no"
            />
            <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta name="author" content="JongBan Phone Store" />
            <meta name="generator" content="Laravel with Inertia.js" />
            <meta name="theme-color" content="#2563eb" />
            <meta name="msapplication-TileColor" content="#2563eb" />
            <meta name="msapplication-config" content="/browserconfig.xml" />

            {/* Enhanced Security Headers */}
            <meta
                httpEquiv="Content-Security-Policy"
                content="upgrade-insecure-requests"
            />
            <meta name="referrer" content="strict-origin-when-cross-origin" />

            {/* Mobile Specific */}
            <meta name="format-detection" content="telephone=yes" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta
                name="apple-mobile-web-app-status-bar-style"
                content="black-translucent"
            />
            <meta name="apple-mobile-web-app-title" content={siteName} />

            {/* PWA iOS */}
            <meta name="apple-touch-fullscreen" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />

            {/* Verification Meta Tags (Add your actual verification codes) */}
            <meta
                name="google-site-verification"
                content="VRUJOTdKsRylCb6e7YmNa_oPFnFfRWrJ6tYzCh6QmuQ"
            />
            {/* <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" /> */}
            {/* <meta name="facebook-domain-verification" content="YOUR_FACEBOOK_VERIFICATION_CODE" /> */}

            {/* Breadcrumb Structured Data */}
            {breadcrumbs && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            itemListElement: breadcrumbs.map(
                                (crumb, index) => ({
                                    "@type": "ListItem",
                                    position: index + 1,
                                    name: crumb.name,
                                    item: crumb.url,
                                })
                            ),
                        }),
                    }}
                />
            )}

            {/* LocalBusiness Structured Data */}
            {type === "website" && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            "@id": `${defaultBusiness.url}#business`,
                            name: defaultBusiness.name,
                            image: image,
                            description: description,
                            url: defaultBusiness.url,
                            telephone: defaultBusiness.phone,
                            email: defaultBusiness.email,
                            address: {
                                "@type": "PostalAddress",
                                streetAddress: defaultBusiness.address,
                                addressLocality: "Phnom Penh",
                                addressCountry: "KH",
                            },
                            geo: {
                                "@type": "GeoCoordinates",
                                latitude: "11.5564",
                                longitude: "104.9282",
                            },
                            openingHours: defaultBusiness.hours,
                            priceRange: defaultBusiness.priceRange,
                            aggregateRating: {
                                "@type": "AggregateRating",
                                ratingValue: "4.8",
                                reviewCount: "127",
                            },
                            sameAs: [
                                "https://facebook.com/jongbanstore",
                                "https://instagram.com/jongbanstore",
                                "https://twitter.com/jongbanstore",
                            ],
                        }),
                    }}
                />
            )}

            {/* Website Structured Data */}
            {type === "website" && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebSite",
                            name: siteName,
                            alternateName: "JongBan Store",
                            url: currentUrl,
                            description: description,
                            inLanguage: ["en", "km", "zh"],
                            publisher: {
                                "@type": "Organization",
                                name: siteName,
                                logo: {
                                    "@type": "ImageObject",
                                    url: `${defaultBusiness.url}/images/brand-logo/blue-logo.png`,
                                },
                            },
                            potentialAction: {
                                "@type": "SearchAction",
                                target: {
                                    "@type": "EntryPoint",
                                    urlTemplate: `${currentUrl}/shop?search={search_term_string}`,
                                },
                                "query-input":
                                    "required name=search_term_string",
                            },
                        }),
                    }}
                />
            )}

            {/* Default Organization Structured Data */}
            {!structured_data && type !== "website" && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Organization",
                            name: siteName,
                            url: currentUrl || "https://jongban.e-khmer.com",
                            logo: {
                                "@type": "ImageObject",
                                url: "https://jongban.e-khmer.com/images/brand-logo/blue-logo.png",
                            },
                            sameAs: [
                                "https://facebook.com/jongbanstore",
                                "https://twitter.com/jongbanstore",
                                "https://instagram.com/jongbanstore",
                            ],
                            contactPoint: {
                                "@type": "ContactPoint",
                                telephone: defaultBusiness.phone,
                                contactType: "customer service",
                                areaServed: "KH",
                                availableLanguage: [
                                    "English",
                                    "Khmer",
                                    "Chinese",
                                ],
                            },
                        }),
                    }}
                />
            )}

            {/* Product Structured Data for phone products */}
            {type === "product" && price && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Product",
                            name: fullTitle,
                            description: description,
                            image: image,
                            brand: {
                                "@type": "Brand",
                                name: brand || "JongBan Store",
                            },
                            model: model,
                            sku: productId,
                            mpn: productId,
                            category: "Electronics > Mobile Phones",
                            offers: {
                                "@type": "Offer",
                                url: currentUrl,
                                priceCurrency: currency,
                                price: price,
                                availability: `https://schema.org/${
                                    availability || "InStock"
                                }`,
                                itemCondition: `https://schema.org/${
                                    condition === "new"
                                        ? "NewCondition"
                                        : "UsedCondition"
                                }`,
                                seller: {
                                    "@type": "Organization",
                                    name: siteName,
                                },
                                priceValidUntil: new Date(
                                    Date.now() + 30 * 24 * 60 * 60 * 1000
                                )
                                    .toISOString()
                                    .split("T")[0],
                            },
                            aggregateRating: {
                                "@type": "AggregateRating",
                                ratingValue: "4.8",
                                reviewCount: "127",
                            },
                            review: reviewData && {
                                "@type": "Review",
                                reviewRating: {
                                    "@type": "Rating",
                                    ratingValue: reviewData.rating,
                                    bestRating: "5",
                                },
                                author: {
                                    "@type": "Person",
                                    name: reviewData.author,
                                },
                                reviewBody: reviewData.body,
                            },
                        }),
                    }}
                />
            )}

            {/* FAQ Structured Data */}
            {faqData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: faqData.map((faq) => ({
                                "@type": "Question",
                                name: faq.question,
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: faq.answer,
                                },
                            })),
                        }),
                    }}
                />
            )}

            {/* Video Structured Data */}
            {videoData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "VideoObject",
                            name: videoData.title,
                            description: videoData.description,
                            thumbnailUrl: videoData.thumbnail,
                            uploadDate: videoData.uploadDate,
                            duration: videoData.duration,
                            embedUrl: videoData.embedUrl,
                            contentUrl: videoData.contentUrl,
                        }),
                    }}
                />
            )}

            {/* Article Structured Data */}
            {type === "article" && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Article",
                            headline: fullTitle,
                            description: description,
                            image: image,
                            author: {
                                "@type": "Person",
                                name: author || "JongBan Store",
                            },
                            publisher: {
                                "@type": "Organization",
                                name: siteName,
                                logo: {
                                    "@type": "ImageObject",
                                    url: `${defaultBusiness.url}/images/brand-logo/blue-logo.png`,
                                },
                            },
                            datePublished: publishedTime,
                            dateModified: modifiedTime || publishedTime,
                            mainEntityOfPage: {
                                "@type": "WebPage",
                                "@id": currentUrl,
                            },
                        }),
                    }}
                />
            )}

            {/* Custom Structured Data */}
            {structured_data && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(structured_data),
                    }}
                />
            )}
        </Head>
    );
}
