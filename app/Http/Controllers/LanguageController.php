<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Session;

class LanguageController extends Controller
{
    /**
     * Available languages in the application
     */
    private $availableLanguages = ['en', 'kh', 'zh'];

    /**
     * Switch the language
     */
    public function switch(Request $request, $language)
    {
        // Validate if the language is supported
        if (!in_array($language, $this->availableLanguages)) {
            return response()->json(['error' => 'Language not supported'], 400);
        }

        // Set the application locale
        App::setLocale($language);
        
        // Store language preference in session
        Session::put('locale', $language);

        return response()->json([
            'success' => true,
            'language' => $language,
            'message' => 'Language switched successfully'
        ]);
    }

    /**
     * Get current language
     */
    public function current()
    {
        return response()->json([
            'current_language' => App::getLocale(),
            'available_languages' => $this->availableLanguages
        ]);
    }

    /**
     * Get all available languages with their names
     */
    public function available()
    {
        $languages = [
            'en' => [
                'code' => 'en',
                'name' => 'English',
                'native_name' => 'English'
            ],
            'kh' => [
                'code' => 'kh', 
                'name' => 'Khmer',
                'native_name' => 'ខ្មែរ'
            ],
            'zh' => [
                'code' => 'zh',
                'name' => 'Chinese',
                'native_name' => '中文'
            ]
        ];

        return response()->json($languages);
    }
}
