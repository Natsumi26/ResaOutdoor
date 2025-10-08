# 📖 Guide d'Installation - CanyonLife Booking System

## ✅ Ce qui a été créé

### Backend (Node.js + Express + Prisma)
- ✅ Structure complète du serveur Express
- ✅ Schéma Prisma avec 8 modèles de données
- ✅ Authentification JWT avec bcrypt
- ✅ API REST complète avec 7 modules :
  - Auth (login, session)
  - Users (CRUD utilisateurs/guides)
  - Categories (CRUD catégories)
  - Products (CRUD produits/activités)
  - Sessions (CRUD créneaux)
  - Bookings (CRUD réservations + paiements + historique)
  - Gift Vouchers (CRUD bons cadeaux)
- ✅ Middlewares (auth, error handling)
- ✅ Script de seed avec compte admin par défaut

### Frontend (React + Vite)
- ✅ Configuration Vite avec proxy API
- ✅ Système d'authentification (Context API)
- ✅ Service API Axios centralisé
- ✅ Page de connexion stylisée
- ✅ Dashboard avec sidebar et navigation
- ✅ 5 pages fonctionnelles :
  - Calendar (placeholder pour calendrier)
  - Users (gestion complète avec modal)
  - Categories (gestion complète avec modal)
  - Products (affichage liste avec cards)
  - GiftVouchers (gestion complète avec modal)
- ✅ Styles CSS modules réutilisables
- ✅ Routing avec React Router v6

## 🚀 Installation Rapide

### 1. Installer PostgreSQL
```bash
# Télécharger depuis postgresql.org
# Créer la base de données
psql -U postgres
CREATE DATABASE booking_saas;
\q
```

### 2. Configuration Backend
```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos informations PostgreSQL
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. Configuration Frontend
```bash
cd frontend
npm install
```

### 4. Démarrage
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Connexion
- URL : http://localhost:3000
- Login : `canyonlife`
- Password : `canyonlife`

## 📋 Structure Base de Données

```
User (utilisateurs/guides)
├── login, password, email
├── role (admin/guide)
└── stripeAccount

Category (catégories d'activités)
├── name, description
└── products[]

Product (produits/activités)
├── name, descriptions, price
├── duration, color, level
├── maxCapacity, autoClose
├── wazeLink, googleMapsLink
├── images[]
└── relations: guide, category

Session (créneaux planifiés)
├── date, timeSlot, startTime
├── isMagicRotation
├── magicRotationProducts[]
└── relations: product, guide, bookings[]

Booking (réservations)
├── client info (name, email, phone, nationality)
├── numberOfPeople, totalPrice, amountPaid
├── status (pending/confirmed/cancelled)
└── relations: session, payments[], history[]

Payment (paiements)
├── amount, method, stripeId
└── relation: booking

BookingHistory (historique)
├── action, details, timestamp
└── relation: booking

GiftVoucher (bons cadeaux)
├── code, amount
├── isUsed, usedAt, usedBy
└── expiresAt
```

## 🔌 Endpoints API Principaux

### Auth
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur courant

### Users (Admin only)
- `GET /api/users` - Liste
- `POST /api/users` - Créer
- `PUT /api/users/:id` - Modifier
- `DELETE /api/users/:id` - Supprimer

### Categories
- CRUD complet sur `/api/categories`

### Products
- CRUD complet sur `/api/products`
- Query params: `?guideId=...&categoryId=...`

### Sessions
- CRUD complet sur `/api/sessions`
- Query params: `?startDate=...&endDate=...&guideId=...`

### Bookings
- CRUD + actions spéciales:
  - `POST /api/bookings/:id/payment` - Ajouter paiement
  - `POST /api/bookings/:id/cancel` - Annuler
  - `POST /api/bookings/:id/move` - Déplacer

### Gift Vouchers
- CRUD complet sur `/api/gift-vouchers`
- `POST /api/gift-vouchers/:code/use` - Utiliser

## 🎯 Prochaines Fonctionnalités à Développer

### Priorité 1 - Calendrier Hebdomadaire
- [x] Vue semaine (7 jours, colonnes matin/après-midi)
- [x] Affichage des sessions et créneaux
- [x] Visualisation des réservations (rectangles colorés)
- [x] Barre de progression du remplissage
- [ ] Drag & drop des réservations
- [x] Navigation semaine précédente/suivante
- [x] Bouton "Aujourd'hui"

### Priorité 2 - Popup Détaillée Réservation
- [x] Affichage informations client
- [x] Détails activité et session
- [x] Historique des modifications
- [x] Gestion des paiements
- [ ] Actions (modifier, annuler, déplacer)
- [x] Envoi email

### Priorité 3 - Formulaire Produit Complet
- [x] Upload d'images (multipart/form-data)
- [x] Sélecteur de couleur (react-color)
- [x] Configuration prix groupe
- [x] Tous les champs du schéma

### Priorité 4 - Formulaire Session Complet
- [x] Création depuis un produit type
- [x] Mode "Rotation Magique"
- [x] Sélection multi-produits
- [x] Configuration horaires

### Priorité 5 - Intégrations
- [x] Upload images (stockage local ou cloud) ✅
- [x] Intégration Stripe pour paiements ✅
  - Paiement en ligne sécurisé via Stripe Checkout
  - Bouton "Payer avec Stripe" dans BookingModal
  - Webhook automatique pour confirmation de paiement
  - Support paiements partiels (solde restant)
  - Cartes de test disponibles
  - Voir [STRIPE_SETUP.md](STRIPE_SETUP.md) pour la configuration
- [x] Envoi emails (nodemailer) ✅
  - Email de confirmation automatique à chaque réservation
  - Bouton "Envoyer email" dans BookingModal
  - API pour emails de rappel et emails personnalisés
  - Templates HTML responsive
  - Voir [EMAIL_SETUP.md](EMAIL_SETUP.md) pour la configuration
- [ ] Notifications temps réel (socket.io)


## 🛠️ Commandes Utiles

### Backend
```bash
npm run dev              # Mode développement (nodemon)
npm start                # Production
npm run prisma:studio    # Interface Prisma (DB GUI)
npm run prisma:migrate   # Nouvelle migration
npm run prisma:seed      # Reset data
```

### Frontend
```bash
npm run dev              # Mode développement
npm run build            # Build production
npm run preview          # Preview du build
```

## 🐛 Dépannage

### Erreur "Cannot find module"
```bash
cd backend && npm install
cd frontend && npm install
```

### Erreur Prisma
```bash
cd backend
npm run prisma:generate
```

### Port déjà utilisé
- Backend: Changer PORT dans `.env`
- Frontend: Changer dans `vite.config.js`

### Base de données
```bash
# Vérifier que PostgreSQL est lancé
# Windows: Services > PostgreSQL
# Vérifier DATABASE_URL dans .env
```

## 📞 Support

Pour toute question sur le projet, consultez le README.md principal.

---

**Note**: Ce projet est en cours de développement. L'interface client et certaines fonctionnalités avancées seront développées dans une phase ultérieure.
