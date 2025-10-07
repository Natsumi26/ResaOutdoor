# 📋 Popup Détaillée Réservation - Documentation

## Vue d'ensemble

La popup (modale) de réservation s'affiche lorsqu'on clique sur un badge de réservation dans le calendrier. Elle permet de consulter et gérer tous les détails d'une réservation.

## ✅ Fonctionnalités implémentées

### 1. **Affichage Informations Client**
- Nom complet
- Email
- Téléphone
- Nationalité (si renseignée)

### 2. **Détails Activité & Session**
- Nom de l'activité
- Date complète (format: "Jeudi 21 juin 2024")
- Créneau (Matin/Après-midi/Journée) + heure de début
- Guide assigné

### 3. **Détails Réservation**
- Nombre de personnes
- Prix total
- Montant payé
- Reste à payer
- Barre de progression du paiement (%)

### 4. **Gestion des Paiements**
- Liste de tous les paiements avec:
  - Montant
  - Méthode (CB, Espèces, Virement, Stripe, Autre)
  - Date et heure
  - Notes éventuelles
- Formulaire d'ajout de paiement
- Calcul automatique du reste à payer

### 5. **Historique des Modifications**
- Timeline chronologique
- Actions: created, modified, payment, cancelled
- Détails de chaque action
- Date et heure

### 6. **Actions disponibles**
- ✉️ **Envoyer email** : Email au client (à implémenter)
- ❌ **Annuler réservation** : Avec confirmation
- 🔄 **Fermer** : Ferme la modale

## 🎨 Interface

### Structure de la modale

```
┌────────────────────────────────────────┐
│ Réservation #12345678       [Confirmée]│ ← Header violet
├────────────────────────────────────────┤
│ [📋 Informations] [💳 Paiements] [...] │ ← Tabs
├────────────────────────────────────────┤
│                                        │
│  Contenu selon l'onglet actif         │
│                                        │
├────────────────────────────────────────┤
│ [📧 Envoyer email]  [❌]  [Fermer]    │ ← Footer
└────────────────────────────────────────┘
```

### 3 Onglets

#### 📋 **Informations**
- Informations client
- Activité & Session
- Détails réservation avec barre de progression

#### 💳 **Paiements**
- Bouton "+ Ajouter un paiement"
- Formulaire d'ajout (si ouvert)
- Liste des paiements existants

#### 📜 **Historique**
- Timeline des actions
- Ordre chronologique (plus récent en haut)

## 🎨 Codes couleurs

### Statuts de réservation
- **En attente** : Jaune (`pending`)
- **Confirmée** : Vert (`confirmed`)
- **Annulée** : Rouge (`cancelled`)

### Progression de paiement
- **100%** : Vert
- **< 100%** : Orange

## 📡 API utilisée

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/bookings/:id` | GET | Récupérer détails réservation |
| `/api/bookings/:id/payment` | POST | Ajouter un paiement |
| `/api/bookings/:id/cancel` | POST | Annuler la réservation |

## 🔌 Intégration

### Ouvrir la modale

```jsx
// Dans Calendar.jsx
const [selectedBookingId, setSelectedBookingId] = useState(null);

// Gérer le clic
const handleBookingClick = (bookingId) => {
  setSelectedBookingId(bookingId);
};

// Affichage
{selectedBookingId && (
  <BookingModal
    bookingId={selectedBookingId}
    onClose={() => setSelectedBookingId(null)}
    onUpdate={loadSessions}
  />
)}
```

### Props de BookingModal

| Prop | Type | Description |
|------|------|-------------|
| `bookingId` | string | ID de la réservation |
| `onClose` | function | Callback fermeture modale |
| `onUpdate` | function | Callback après modification |

## 🚀 Utilisation

1. **Cliquer** sur un badge de réservation dans le calendrier
2. La modale s'ouvre avec l'onglet "Informations"
3. **Naviguer** entre les onglets avec les boutons
4. **Ajouter un paiement** :
   - Cliquer sur "+ Ajouter un paiement"
   - Remplir le formulaire
   - Cliquer sur "Enregistrer"
5. **Annuler la réservation** :
   - Cliquer sur "❌ Annuler réservation"
   - Confirmer l'action
6. **Fermer** la modale avec le bouton "Fermer" ou la croix

## 🔄 Rechargement automatique

- Après ajout de paiement → Recharge les données de la réservation
- Après annulation → Recharge les données
- Après fermeture → Recharge le calendrier (via `onUpdate`)

## 📝 À implémenter (TODO)

- [ ] **Envoi d'email** : Intégration service email
- [ ] **Modifier réservation** : Formulaire d'édition
- [ ] **Déplacer réservation** : Sélecteur de session
- [ ] **Impression** : Export PDF de la réservation
- [ ] **Gestion des bons cadeaux** : Application/Retrait

## 🎯 Améliorations possibles

1. **UX**
   - Animation d'ouverture/fermeture
   - Feedback toast après actions
   - Raccourci clavier ESC pour fermer

2. **Fonctionnalités**
   - Recherche dans l'historique
   - Filtre des paiements par méthode
   - Export CSV des paiements

3. **Validation**
   - Empêcher paiement > reste à payer
   - Validation email et téléphone

## 🐛 Notes importantes

- La modale bloque le scroll de la page (overlay)
- Les clics sur l'overlay ferment la modale
- Les clics à l'intérieur de la modale sont stoppés
- Le drag & drop est désactivé pendant qu'on clique sur un badge
