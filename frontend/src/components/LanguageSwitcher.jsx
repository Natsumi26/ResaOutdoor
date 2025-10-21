import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const flagSrc = i18n.language === 'fr' ? '/flags/en.png' : '/flags/fr.png';
  const altText = i18n.language === 'fr' ? 'Switch to English' : 'Passer en français';

  return (
    <button className="lang-switcher" onClick={toggleLanguage}>
      <img src={flagSrc} alt={altText} className="flag-icon" />
    </button>
  );
};

export default LanguageSwitcher;