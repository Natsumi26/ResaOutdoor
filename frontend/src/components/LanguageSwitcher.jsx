import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../pages/client/ClientPages.module.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const flagSrc = i18n.language === 'fr' ? '/flags/en.png' : '/flags/fr.png';
  const altText = i18n.language === 'fr' ? 'Switch to English' : 'Passer en français';

  return (
    <button className={styles.langSwitcher} onClick={toggleLanguage}>
      <img src={flagSrc} alt={altText} className={styles.flagIcon} />
    </button>
  );
};

export default LanguageSwitcher;