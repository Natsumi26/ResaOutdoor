import React from 'react';
import styles from './Calendar.module.css';

const Calendar = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📅 Calendrier Hebdomadaire</h1>
        <button className={styles.btnPrimary}>+ Nouvelle Session</button>
      </div>

      <div className={styles.calendarContainer}>
        <p className={styles.placeholder}>
          Le calendrier hebdomadaire avec drag & drop sera développé ici.
          <br />
          <br />
          Fonctionnalités prévues :
        </p>
        <ul className={styles.featureList}>
          <li>Vue semaine avec colonnes matin/après-midi</li>
          <li>Affichage des sessions et réservations</li>
          <li>Barre de progression du remplissage</li>
          <li>Drag & drop des réservations entre créneaux</li>
          <li>Rotation magique pour sessions multi-produits</li>
          <li>Popup détaillée au clic sur une réservation</li>
        </ul>
      </div>
    </div>
  );
};

export default Calendar;
