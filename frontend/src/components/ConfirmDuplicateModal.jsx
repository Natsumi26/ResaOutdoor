import styles from './ConfirmDuplicateModal.module.css';

const ConfirmDuplicateModal = ({ onConfirm, onCancel }) => {
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconContainer}>
          <div className={styles.successIcon}>✓</div>
        </div>

        <h2 className={styles.title}>Session créée avec succès !</h2>

        <p className={styles.message}>
          Voulez-vous dupliquer cette session sur d'autres jours ?
        </p>

        <div className={styles.actions}>
          <button className={styles.btnCancel} onClick={onCancel}>
            Non, merci
          </button>
          <button className={styles.btnConfirm} onClick={onConfirm}>
            📋 Oui, dupliquer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDuplicateModal;
