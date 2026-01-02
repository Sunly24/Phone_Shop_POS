<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Response as HttpResponse;

class PublicController extends Controller
{
    public function home(): Response
    {
        $featuredProducts = Product::where('product_status', true)
            ->with(['brand', 'category', 'images'])
            ->latest()
            ->take(8)
            ->get();

        $categories = Category::withCount(['products' => function ($query) {
            $query->where('product_status', true);
        }])
            ->take(6)
            ->get();

        // Organization structured data
        $organizationData = [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => 'Jong Ban Store',
            'alternateName' => 'Jong Ban Store',
            'description' => 'Professional phone shop with premium mobile phones and exceptional service.',
            'url' => route('home'),
            'logo' => url('/images/brand-logo/blue-logo.png'),
            'image' => url('/images/og-default.jpg'),
            'sameAs' => [
                'https://facebook.com/jongbanstore',
                'https://instagram.com/jongbanstore'
            ],
            'contactPoint' => [
                '@type' => 'ContactPoint',
                'telephone' => '+855-123-4567',
                'contactType' => 'customer service',
                'availableLanguage' => ['English', 'Khmer']
            ],
            'address' => [
                '@type' => 'PostalAddress',
                'addressCountry' => 'KH',
                'addressLocality' => 'Phnom Penh'
            ]
        ];

        return Inertia::render('Public/Home', [
            'featuredProducts' => $featuredProducts,
            'categories' => $categories,
            'seo' => [
                'title' => 'Jong Ban Store - Premium Mobile Phones & Smartphones',
                'description' => 'Discover the latest smartphones from top brands at Jong Ban Store. Quality mobile phones with competitive prices, warranty, and excellent customer service.',
                'keywords' => 'Jong Ban Store, Jong Ban Store, mobile phones, smartphones, iPhone, Samsung, phone shop, buy phones online',
                'canonical' => route('home'),
                'type' => 'website',
                'image' => url('/images/og-default.jpg'),
                'structured_data' => $organizationData
            ]
        ]);
    }

    public function shop(Request $request): Response
    {
        $search = $request->input('search', '');
        $categoryId = $request->input('category');
        $brandId = $request->input('brand');
        $perPage = $request->input('per_page', 12);

        $query = Product::where('product_status', true)
            ->with(['brand', 'category', 'images']);

        // Apply filters
        if ($search) {
            $query->where('product_title', 'like', "%{$search}%");
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        $products = $query->latest()->paginate($perPage)->appends($request->all());

        $categories = Category::all();
        $brands = Brand::all();

        // Dynamic SEO based on filters
        $title = 'Shop Mobile Phones - Jong Ban Store';
        $description = 'Browse our complete collection of mobile phones and smartphones from top brands. Find your perfect device at Jong Ban Store.';
        $keywords = 'shop mobile phones, buy smartphones, phone catalog, mobile phone store, Jong Ban Store';

        if ($categoryId && $category = Category::find($categoryId)) {
            $title = "{$category->name} Phones - Jong Ban Store";
            $description = "Shop {$category->name} phones and smartphones at Jong Ban Store. Wide selection with competitive prices, warranty, and fast service.";
            $keywords = "{$category->name} phones, {$category->name} smartphones, buy {$category->name}, Jong Ban Store";
        }

        if ($search) {
            $title = "Search Results for '{$search}' - Jong Ban Store";
            $description = "Find mobile phones matching '{$search}' at Jong Ban Store. Quality devices with competitive prices and warranty.";
        }

        return Inertia::render('Public/Shop', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'filters' => $request->only(['search', 'category', 'brand', 'per_page']),
            'seo' => [
                'title' => $title,
                'description' => $description,
                'keywords' => $keywords,
                'canonical' => route('public.shop'),
                'type' => 'website',
                'image' => url('/images/og-default.jpg')
            ]
        ]);
    }

    public function productDetail($id): Response
    {
        $product = Product::where('product_status', true)
            ->with(['brand', 'maker', 'category', 'color', 'size', 'images'])
            ->findOrFail($id);

        // Get related products for recommendations
        $relatedProducts = Product::where('product_status', true)
            ->where('category_id', $product->category_id)
            ->where('product_id', '!=', $product->product_id)
            ->with(['brand', 'images'])
            ->take(4)
            ->get();

        // Get product image for OG tags
        $productImage = $product->images && $product->images->isNotEmpty()
            ? url($product->images->first()->image_path)
            : url('/images/og-default.jpg');

        // Generate breadcrumbs
        $breadcrumbs = [
            ['name' => 'Home', 'url' => route('home')],
            ['name' => 'Shop', 'url' => route('public.shop')],
        ];

        if ($product->category) {
            $breadcrumbs[] = [
                'name' => $product->category->name,
                'url' => route('public.shop', ['category' => $product->category_id])
            ];
        }

        $breadcrumbs[] = [
            'name' => $product->product_title,
            'url' => route('public.product', $product->product_id)
        ];

        // Enhanced structured data for SEO
        $structuredData = [
            '@context' => 'https://schema.org/',
            '@type' => 'Product',
            'name' => $product->product_title,
            'description' => $product->product_description ?: "High-quality {$product->product_title} from {$product->brand?->brand_title}",
            'sku' => $product->product_code,
            'image' => $product->images ? $product->images->pluck('image_path')->map(fn($path) => url($path))->toArray() : [url('/images/og-default.jpg')],
            'brand' => [
                '@type' => 'Brand',
                'name' => $product->brand?->brand_title ?: 'Unknown'
            ],
            'category' => $product->category?->name ?: 'Mobile Phones',
            'offers' => [
                '@type' => 'Offer',
                'url' => route('public.product', $product->product_id),
                'price' => $product->product_price,
                'priceCurrency' => 'USD',
                'availability' => $product->product_stock > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                'condition' => 'https://schema.org/NewCondition',
                'seller' => [
                    '@type' => 'Organization',
                    'name' => 'Jong Ban Store'
                ],
                'priceValidUntil' => now()->addDays(30)->format('Y-m-d')
            ],
            'aggregateRating' => [
                '@type' => 'AggregateRating',
                'ratingValue' => '4.8',
                'reviewCount' => '127',
                'bestRating' => '5',
                'worstRating' => '1'
            ]
        ];

        return Inertia::render('Public/ProductDetail', [
            'product' => $product,
            'relatedProducts' => $relatedProducts,
            'seo' => [
                'title' => $product->product_title . ' - JB Store',
                'description' => $this->truncateText(
                    $product->product_description ?: "Premium {$product->product_title} from {$product->brand?->brand_title}. High-quality mobile phone with exceptional performance. Buy now with fast shipping and warranty.",
                    155
                ),
                'keywords' => implode(', ', array_filter([
                    $product->product_title,
                    $product->brand?->brand_title,
                    $product->color?->color_title,
                    $product->category?->name,
                    'mobile phone',
                    'smartphone',
                    'buy online',
                    'Jong Ban Store'
                ])),
                'canonical' => route('public.product', $product->product_id),
                'type' => 'product',
                'image' => $productImage,
                'price' => $product->product_price,
                'currency' => 'USD',
                'availability' => $product->product_stock > 0 ? 'InStock' : 'OutOfStock',
                'brand' => $product->brand?->brand_title,
                'model' => $product->product_title,
                'productId' => $product->product_code,
                'structured_data' => $structuredData,
                'breadcrumbs' => $breadcrumbs
            ]
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('Public/About', [
            'seo' => [
                'title' => 'About Jong Ban Store - Premium Mobile Phone Retailer',
                'description' => 'Learn about Jong Ban Store\'s commitment to providing quality mobile phones and excellent customer service. Your trusted phone retailer since years.',
                'keywords' => 'about Jong Ban Store, mobile phone retailer, company information, phone store, Jong Ban Store',
                'canonical' => route('public.about'),
                'type' => 'website',
                'image' => url('/images/og-default.jpg')
            ]
        ]);
    }

    public function contact(): Response
    {
        $contactStructuredData = [
            '@context' => 'https://schema.org',
            '@type' => 'ContactPage',
            'mainEntity' => [
                '@type' => 'Organization',
                'name' => 'Jong Ban Store',
                'contactPoint' => [
                    '@type' => 'ContactPoint',
                    'telephone' => '+855-123-4567',
                    'contactType' => 'customer service',
                    'availableLanguage' => ['English', 'Khmer']
                ]
            ]
        ];

        return Inertia::render('Public/Contact', [
            'seo' => [
                'title' => 'Contact Jong Ban Store - Customer Support & Store Location',
                'description' => 'Get in touch with Jong Ban Store for support, inquiries, or visit our store. We are here to help you find the perfect phone.',
                'keywords' => 'contact Jong Ban Store, customer support, store location, phone store contact, Jong Ban Store contact',
                'canonical' => route('public.contact'),
                'type' => 'website',
                'image' => url('/images/og-default.jpg'),
                'structured_data' => $contactStructuredData
            ]
        ]);
    }

    public function faq(): Response
    {
        $faqs = [
            [
                'question' => 'Do you offer warranty on mobile phones?',
                'answer' => 'Yes, we offer manufacturer warranty on all new phones and our own warranty on refurbished devices. Warranty periods vary by product and are clearly stated on each product page.'
            ],
            [
                'question' => 'Do you provide phone repair services?',
                'answer' => 'Yes, we offer comprehensive phone repair services including screen replacement, battery replacement, and software troubleshooting for all major brands.'
            ],
            [
                'question' => 'What payment methods do you accept?',
                'answer' => 'We accept cash and KHQR payments for your convenience. We also offer financing options for qualified customers.'
            ],
            [
                'question' => 'Do you buy used phones?',
                'answer' => 'Yes, we purchase used phones in good condition. We offer competitive prices based on the device model, condition, and current market value.'
            ],
            [
                'question' => 'Where is your store located?',
                'answer' => 'Our store is conveniently located in the city center. Please visit our contact page for detailed directions and store hours.'
            ],
            [
                'question' => 'Do you offer phone insurance?',
                'answer' => 'Yes, we partner with leading insurance providers to offer comprehensive phone insurance plans that cover damage, theft, and loss.'
            ]
        ];

        $faqStructuredData = [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => array_map(function ($faq) {
                return [
                    '@type' => 'Question',
                    'name' => $faq['question'],
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text' => $faq['answer']
                    ]
                ];
            }, $faqs)
        ];

        return Inertia::render('Public/FAQ', [
            'faqs' => $faqs,
            'seo' => [
                'title' => 'Frequently Asked Questions - Jong Ban Store',
                'description' => 'Get answers to common questions about Jong Ban Store services, warranty, repairs, and policies. Expert support for all your mobile phone needs.',
                'keywords' => 'Jong Ban Store FAQ, mobile phone questions, phone warranty, phone repair, phone insurance, Jong Ban Store help',
                'canonical' => route('public.faq'),
                'type' => 'website',
                'image' => url('/images/og-default.jpg'),
                'structured_data' => $faqStructuredData
            ]
        ]);
    }

    public function sitemap(): HttpResponse
    {
        $products = Product::where('product_status', true)
            ->select('product_id', 'product_title', 'updated_at')
            ->get();

        $xml = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        // Add static pages
        $staticPages = [
            ['url' => route('home'), 'changefreq' => 'weekly', 'priority' => '1.0'],
            ['url' => route('public.shop'), 'changefreq' => 'weekly', 'priority' => '0.8'],
            ['url' => route('public.about'), 'changefreq' => 'monthly', 'priority' => '0.7'],
            ['url' => route('public.contact'), 'changefreq' => 'monthly', 'priority' => '0.6'],
            ['url' => route('public.faq'), 'changefreq' => 'monthly', 'priority' => '0.6'],
        ];

        foreach ($staticPages as $page) {
            $xml .= '<url>';
            $xml .= '<loc>' . htmlspecialchars($page['url']) . '</loc>';
            $xml .= '<changefreq>' . $page['changefreq'] . '</changefreq>';
            $xml .= '<priority>' . $page['priority'] . '</priority>';
            $xml .= '</url>';
        }

        // Add product pages
        foreach ($products as $product) {
            $xml .= '<url>';
            $xml .= '<loc>' . route('public.product', $product->product_id) . '</loc>';
            $xml .= '<lastmod>' . $product->updated_at->toISOString() . '</lastmod>';
            $xml .= '<changefreq>weekly</changefreq>';
            $xml .= '<priority>0.9</priority>';
            $xml .= '</url>';
        }

        $xml .= '</urlset>';

        return response($xml, 200, [
            'Content-Type' => 'application/xml'
        ]);
    }

    /**
     * Truncate text for meta descriptions
     */
    private function truncateText($text, $length = 155)
    {
        if (strlen($text) <= $length) {
            return $text;
        }

        return substr($text, 0, $length - 3) . '...';
    }

    /**
     * Show Terms and Conditions page
     */
    public function terms(): Response
    {
        return Inertia::render('Public/Terms', [
            'title' => 'Terms and Conditions - Jong Ban Store',
            'meta' => [
                'description' => 'Read the terms and conditions for using Jong Ban Store services.',
                'keywords' => 'terms and conditions, policy, Jong Ban Store, phone shop',
            ]
        ]);
    }

    /**
     * Show Privacy Policy page
     */
    public function privacy(): Response
    {
        return Inertia::render('Public/Privacy', [
            'title' => 'Privacy Policy - Jong Ban Store',
            'meta' => [
                'description' => 'Learn how Jong Ban Store protects your privacy and handles your personal information.',
                'keywords' => 'privacy policy, data protection, Jong Ban Store, phone shop',
            ]
        ]);
    }
}
