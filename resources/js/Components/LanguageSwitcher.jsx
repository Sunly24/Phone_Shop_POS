import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
    document.documentElement.setAttribute('data-lang', lng);
  };

  // Set initial data-lang attribute on component mount
  React.useEffect(() => {
    const currentLang = i18n.language || localStorage.getItem('language') || 'en';
    document.documentElement.setAttribute('data-lang', currentLang);
  }, []);

  return (
    <div className="form-inline">
      <div className="input-group input-group-sm">
        <div className="input-group-prepend">
          <span className="input-group-text">
            <i className="fas fa-globe"></i>
          </span>
        </div>
        <select 
          className="form-control form-control-sm"
          value={i18n.language}
          onChange={(e) => changeLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="kh" lang="km">ខ្មែរ</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
