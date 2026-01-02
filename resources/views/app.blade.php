<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-lang="{{ app()->getLocale() }}">

<head>
    <meta charset="utf-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="broadcast-driver" content="{{ config('broadcasting.default') }}">

        <!-- Basic meta tags for SEO and browser display -->
    <meta name="description" content="Jong Ban is a leading provider of mobile phones and smartphones in Cambodia. We offer a wide range of high-quality devices at competitive prices.">
    <meta name="keywords" content="smartphones, mobile phones, Jong Ban, phone store, Cambodia, JongBan, JongBan Store, JongBan Shop">
    <meta name="author" content="Jong Ban STORE">

     <!-- Open Graph tags (used by many platforms) -->
    <meta property="og:title" content="ចង់បាន-JongBan Phone Store">
    <meta property="og:description" content="Jong Ban is a leading provider of mobile phones and smartphones in Cambodia. We offer a wide range of high-quality devices at competitive prices.">
    <meta property="og:image" content="{{ asset('images/og-default.jpg') }}">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:site_name" content="Jong Ban STORE">
    <meta property="og:type" content="website">
        
    <!-- Favicon for browser tabs -->
    <link rel="icon" type="image/png" href="{{ asset('images/brand-logo/bag.png') }}">
    <link rel="apple-touch-icon" href="{{ asset('images/brand-logo/bag.png') }}">

    <title inertia>{{ config('app.name', 'ចង់បាន-JongBan Phone Store') }}</title>

    <link rel="manifest" href="public/manifest.json" />
    <link rel="icon" href="/images/brand-logo/bag.png" />
    <meta name="theme-color" content="#2563eb" />
    <link href="resources/js/Utils/service-worker.js" rel="serviceworker" />

    <!-- Preload Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Load fonts with display swap for better performance -->
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Khmer:wght@400;500;600;700&display=swap&text=៖៕។៘៙៚៛៌៍៎៏័៑្់៉៊់៌៍៎៏័ៈ៓។៕៖ៗៜ៝៙៚៛ៗ៝។៕៖៘៙៚៛ៗ។៕" rel="stylesheet" />

    <!-- Scripts -->
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>