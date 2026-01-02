/**
 * Helper functions for language-specific styling
 */

/**
 * Returns the language attribute based on the current i18n language
 * @param {string} currentLang - The current language code ('en' or 'kh')
 * @returns {string} The language attribute ('en' or 'km' for Khmer)
 */
export const getLangAttr = (currentLang) => currentLang === 'kh' ? 'km' : 'en';

/**
 * Returns the appropriate CSS classes for text based on language
 * @param {string} currentLang - The current language code ('en' or 'kh')
 * @param {string} baseClasses - Base CSS classes to be applied regardless of language
 * @returns {string} Combined CSS classes including language-specific classes
 */
export const getTextClasses = (currentLang, baseClasses = '') => {
    const langClasses = currentLang === 'kh' ? 'khmer-text' : 'latin-text';
    return `${baseClasses} ${langClasses}`.trim();
};

/**
 * Sets up global language-specific styling
 * @param {string} lang - The current language code ('en' or 'kh')
 */
export const setupGlobalLanguage = (lang) => {
    // Set the language attribute on the root element
    document.documentElement.setAttribute('data-lang', lang);
    
    // Set the lang attribute on the html tag
    document.documentElement.setAttribute('lang', getLangAttr(lang));
    
    // Add appropriate class to body
    document.body.classList.remove('khmer-text', 'latin-text');
    document.body.classList.add(lang === 'kh' ? 'khmer-text' : 'latin-text');
    
    // Store the language preference
    localStorage.setItem('language', lang);
};
