# 🏔️ CanyonLife - Logiciel de Réservation SaaS

Système de gestion de réservations pour activités de canyon avec interface administrateur.

## 📋 Stack Technique

- **Backend** : Node.js + Express.js
- **Frontend** : React + Vite
- **Base de données** : PostgreSQL
- **ORM** : Prisma
- **Auth** : JWT + bcrypt
- **Paiements** : Stripe API

## 🚀 Installation

### Prérequis

- Node.js 18+ installé
- PostgreSQL installé et en cours d'exécution
- npm ou yarn

### 1. Installation de PostgreSQL

#### Windows
1. Télécharger PostgreSQL depuis [postgresql.org](https://www.postgresql.org/download/windows/)
2. Installer et définir un mot de passe pour l'utilisateur `postgres`
3. Créer une base de données `booking_saas` :
```bash
psql -U postgres
CREATE DATABASE booking_saas;
\q
```

### 2. Configuration du Backend

```bash
cd backend

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
```

Éditer le fichier `.env` et configurer :
```env
DATABASE_URL="postgresql://postgres:VOTRE_PASSWORD@localhost:5432/booking_saas?schema=public"
JWT_SECRET="votre_secret_jwt_ultra_securise_a_changer"
PORT=5000
NODE_ENV=development
```

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les tables de la base de données
npm run prisma:migrate

# Insérer les données initiales (utilisateur admin)
npm run prisma:seed
```

### 3. Configuration du Frontend

```bash
cd ../frontend

# Installer les dépendances
npm install
```

Créer un fichier `.env` dans le dossier frontend (optionnel) :
```env
VITE_API_URL=http://localhost:5000/api
```

## 🎯 Démarrage

### Démarrer le backend
```bash
cd backend
npm run dev
```
Le serveur démarre sur http://localhost:5000

### Démarrer le frontend
```bash
cd frontend
npm run dev
```
L'application démarre sur http://localhost:3000

## 🔑 Connexion

**Compte administrateur par défaut :**
- Login : `canyonlife`
- Mot de passe : `canyonlife`

## 📁 Structure du Projet

```
logiciel-de-resa/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Schéma de la base de données
│   │   └── seed.js            # Données initiales
│   ├── src/
│   │   ├── controllers/       # Logique métier
│   │   ├── routes/            # Routes API
│   │   ├── middleware/        # Middlewares (auth, errors)
│   │   ├── config/            # Configuration
│   │   └── server.js          # Point d'entrée
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Composants réutilisables
│   │   ├── pages/             # Pages de l'application
│   │   ├── context/           # Context API (Auth)
│   │   ├── services/          # Services API
│   │   └── main.jsx           # Point d'entrée
│   └── package.json
│
└── README.md
```

## 🛠️ API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur connecté

### Utilisateurs (Admin only)
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Catégories
- `GET /api/categories` - Liste des catégories
- `POST /api/categories` - Créer une catégorie
- `PUT /api/categories/:id` - Modifier une catégorie
- `DELETE /api/categories/:id` - Supprimer une catégorie

### Produits (Activités)
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `POST /api/products` - Créer un produit
- `PUT /api/products/:id` - Modifier un produit
- `DELETE /api/products/:id` - Supprimer un produit

### Sessions (Créneaux)
- `GET /api/sessions?startDate=...&endDate=...` - Liste des sessions
- `GET /api/sessions/:id` - Détails d'une session
- `POST /api/sessions` - Créer une session
- `PUT /api/sessions/:id` - Modifier une session
- `DELETE /api/sessions/:id` - Supprimer une session

### Réservations
- `GET /api/bookings` - Liste des réservations
- `GET /api/bookings/:id` - Détails d'une réservation
- `POST /api/bookings` - Créer une réservation
- `PUT /api/bookings/:id` - Modifier une réservation
- `POST /api/bookings/:id/payment` - Ajouter un paiement
- `POST /api/bookings/:id/cancel` - Annuler une réservation
- `POST /api/bookings/:id/move` - Déplacer une réservation

### Bons Cadeaux
- `GET /api/gift-vouchers` - Liste des bons cadeaux
- `GET /api/gift-vouchers/:code` - Détails par code
- `POST /api/gift-vouchers` - Créer un bon cadeau
- `POST /api/gift-vouchers/:code/use` - Utiliser un bon cadeau
- `DELETE /api/gift-vouchers/:id` - Supprimer un bon cadeau

## 🗄️ Base de Données

Le schéma Prisma définit les modèles suivants :
- **User** - Utilisateurs/Guides
- **Category** - Catégories d'activités
- **Product** - Produits/Activités (modèles de canyon)
- **Session** - Sessions/Créneaux planifiés
- **Booking** - Réservations
- **Payment** - Paiements
- **BookingHistory** - Historique des modifications
- **GiftVoucher** - Bons cadeaux

## 🔧 Commandes Utiles

### Backend
```bash
npm run dev                      # Démarrer en mode développement
npm start                        # Démarrer en production
npm run setup                    # Installation complète (après git clone)
npm run prisma:studio            # Interface graphique Prisma
npm run prisma:migrate           # Créer une migration
npm run prisma:migrate:deploy    # Appliquer les migrations (prod)
npm run prisma:migrate:status    # Vérifier l'état des migrations
npm run prisma:seed              # Réinitialiser les données
npm run db:backup                # Créer un backup de la BDD
```

### 📚 Documentation Prisma
- **[AIDE_MEMOIRE_PRISMA.md](AIDE_MEMOIRE_PRISMA.md)** - Guide rapide des commandes
- **[GUIDE_PRISMA.md](GUIDE_PRISMA.md)** - Guide complet des bonnes pratiques

### Frontend
```bash
npm run dev              # Démarrer en mode développement
npm run build            # Build pour production
npm run preview          # Preview du build
```

## 📝 Prochaines Étapes

Les pages React suivantes sont à développer :

1. **Calendar** - Calendrier hebdomadaire avec drag & drop
2. **Users** - Gestion des utilisateurs/guides (admin)
3. **Categories** - Gestion des catégories
4. **Products** - Gestion des produits/activités
5. **GiftVouchers** - Gestion des bons cadeaux
6. **BookingModal** - Popup détaillée de réservation

## 🎨 Fonctionnalités à Implémenter

- [ ] Calendrier hebdomadaire interactif
- [ ] Drag & drop des réservations
- [ ] Gestion des images produits (upload)
- [ ] Intégration Stripe
- [ ] Notifications email
- [ ] Export PDF/Excel
- [ ] Interface client (future phase)

## 📄 Licence

Propriétaire - CanyonLife

## 👨‍💻 Auteur

Développé pour CanyonLife
