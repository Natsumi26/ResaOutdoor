import React from 'react';
import styles from './GiftVoucherPreview.module.css';

const GiftVoucherPreview = ({
  amount,
  buyerName,
  recipientName,
  personalMessage,
  companyName,
  companyPhone,
  companyEmail,
  companyWebsite,
  logo,
  slogan,
  themeColor,
  isOpen,
  onClose
}) => {
  // Générer un code masqué pour la pré-visualisation
  const generateMaskedCode = () => {
    const code = 'GY' + Math.random().toString(36).substr(2, 9).toUpperCase();
    return code.substring(0, 4) + ' ' + code.substring(4, 8) + ' ' + '****';
  };

  const maskedCode = generateMaskedCode();

  if (!isOpen) return null;

  const logoUrl = logo ? (logo.startsWith('http') ? logo : `http://localhost:5000${logo}`) : null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        <div className={styles.voucherContainer}>
      <div className={styles.voucherCard} style={{ borderLeftColor: themeColor }}>
        {/* Bande colorée à gauche */}
        <div className={styles.leftBand} style={{ backgroundColor: themeColor }}>
          <div className={styles.bandContent}>
            <div className={styles.bandLabel}>BON CADEAU</div>
            <div className={styles.bandAmount}>{amount}€</div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className={styles.mainContent}>
          {/* Header avec logo et tagline */}
          <div className={styles.header}>
            <div className={styles.logoSection}>
              {logoUrl && (
                <img src={logoUrl} alt="Logo" className={styles.logo} onError={(e) => e.target.style.display = 'none'} />
              )}
            </div>
            <p className={styles.tagline}>{slogan || 'Pour une sortie exceptionnelle'}</p>
          </div>

          {/* Description et montant */}
          <div className={styles.voucherInfo}>
            <h2 className={styles.voucherTitle}>🎁 Bon cadeau d'une valeur de {amount}€</h2>
            <p className={styles.voucherDescription}>
              Sensations fortes et paysages à couper le souffle !
            </p>
          </div>

          {/* Bénéficiaire */}
          {recipientName && (
            <div className={styles.beneficiary} style={{ borderLeftColor: themeColor, backgroundColor: themeColor + '08' }}>
              <p className={styles.beneficiaryLabel}>Pour <strong>{recipientName}</strong></p>
              {personalMessage && (
                <p className={styles.personalMessage}>« {personalMessage} »</p>
              )}
            </div>
          )}

          {/* Code du bon (masqué) */}
          <div className={styles.codeSection} style={{ borderTopColor: themeColor + '30', borderBottomColor: themeColor + '30' }}>
            <div className={styles.codeBox}>
              <div className={styles.codeLabel} style={{ color: themeColor }}>Code du bon</div>
              <div className={styles.maskedText}>Code reçu par email après paiement</div>
              <div className={styles.codeHint}>Utilisable sur le site internet en une ou plusieurs fois</div>
            </div>
          </div>

          {/* Validité */}
          <div className={styles.validity}>
            <p>
              <strong>Valable jusqu'au :</strong> 31/12/2027
            </p>
            <p className={styles.disclaimer}>Non échangeable, non remboursable</p>
          </div>

          {/* Contact footer */}
          <div className={styles.footer}>
            <div className={styles.footerContent}>
              <p>{companyWebsite && <a href={`https://${companyWebsite}`} style={{ color: themeColor }}>{companyWebsite}</a>} {companyEmail && `| ${companyEmail}`}</p>
              {companyPhone && <p>{companyPhone}</p>}
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default GiftVoucherPreview;
