# 📅 Calendrier Hebdomadaire - Documentation

## Vue d'ensemble

Le calendrier hebdomadaire a été implémenté avec une interface similaire à Trekker Pro. Il permet de visualiser et gérer les sessions et réservations sur une semaine complète.

## Composants créés

### 1. **WeeklyCalendar** (`src/components/WeeklyCalendar.jsx`)
Composant principal du calendrier qui gère :
- Navigation entre les semaines (Aujourd'hui, ◀, ▶)
- Filtres (Réservations, Paiements, Stocks)
- Vue 7 jours avec créneaux Matin/Après-midi
- Intégration drag & drop avec `react-beautiful-dnd`

### 2. **SessionSlot** (`src/components/SessionSlot.jsx`)
Composant représentant une session avec :
- Heure de début (ex: 09:00, 13:00)
- Nom du produit/activité
- Compteur de participants (ex: 6/12)
- Barre de progression colorée :
  - Vert : < 80% rempli
  - Orange : 80-99% rempli
  - Rouge : 100% rempli
- Couleur latérale selon le type de produit :
  - 🟧 Orange : Raft intégral
  - 🔴 Rouge : Raft découverte
  - 🔵 Bleu : Zoïcu
  - 🔵 Bleu clair : Zoïcu sportif
  - 🟣 Violet : Baptême

### 3. **BookingBadge** (`src/components/BookingBadge.jsx`)
Badge de réservation draggable avec :
- Nombre de participants (nombre affiché en gros)
- Icône de statut de paiement :
  - ✓ : Payé intégralement
  - ◐ : Paiement partiel
  - ○ : Non payé
  - ✕ : Annulé
- Nom du client (format: Prénom N.)
- Couleur selon paiement :
  - 🟢 Vert : Payé
  - 🟠 Orange : Partiel
  - 🔴 Rouge : Non payé
  - ⚪ Gris : Annulé

## Fonctionnalités

### ✅ Implémenté
- [x] Vue hebdomadaire avec 7 jours
- [x] Créneaux Matin / Après-midi
- [x] Affichage des sessions avec produits
- [x] Barres de progression du remplissage
- [x] Drag & drop des réservations entre sessions
- [x] Badges de réservation colorés
- [x] Filtres (Réservations, Paiements, Stocks)
- [x] Navigation semaine (précédent/suivant/aujourd'hui)
- [x] Intégration API backend

### 🔄 À implémenter
- [ ] Modale de détails de session (au clic)
- [ ] Modale de création de session
- [ ] Modale de détails de réservation
- [ ] Gestion rotation magique (sessions multi-produits)
- [ ] Indicateurs de stocks
- [ ] Notifications lors du drag & drop
- [ ] Impression du planning

## Structure des données

### Session
```javascript
{
  id: "uuid",
  date: "2024-06-21",
  timeSlot: "matin" | "après-midi",
  startTime: "09:00",
  isMagicRotation: false,
  product: {
    id: "uuid",
    name: "Raft intégral",
    maxCapacity: 12
  },
  guide: {
    id: "uuid",
    login: "guide1"
  },
  bookings: [...]
}
```

### Booking
```javascript
{
  id: "uuid",
  clientFirstName: "John",
  clientLastName: "Doe",
  numberOfPeople: 3,
  totalPrice: 150,
  amountPaid: 75,
  status: "pending" | "confirmed" | "cancelled",
  sessionId: "uuid"
}
```

## API utilisée

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/sessions` | GET | Récupérer sessions (avec filtres date) |
| `/api/bookings/:id/move` | POST | Déplacer une réservation |
| `/api/sessions/:id` | GET | Détails d'une session |
| `/api/bookings/:id` | GET | Détails d'une réservation |

## Utilisation

### Démarrer le projet
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Tester le calendrier
1. Se connecter avec : `canyonlife` / `canyonlife`
2. Naviguer vers la page "Calendrier"
3. Le calendrier charge les sessions de la semaine courante

## Améliorations possibles

1. **Performance**
   - Ajouter React.memo sur les composants
   - Virtualiser les listes si beaucoup de sessions

2. **UX**
   - Animations lors du drag & drop
   - Feedback visuel (toasts)
   - Raccourcis clavier (← → pour navigation)

3. **Fonctionnalités**
   - Export PDF du planning
   - Vue journalière / mensuelle
   - Recherche de client
   - Filtres avancés (guide, produit, etc.)

## Dépendances

- `react-beautiful-dnd` : Drag & drop
- `date-fns` : Manipulation des dates
- `axios` : Requêtes API
