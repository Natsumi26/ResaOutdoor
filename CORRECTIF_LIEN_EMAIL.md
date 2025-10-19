# Correctif - Lien email erreur 401

## Problème identifié

Lorsqu'un client reçoit un email avec le lien vers sa réservation, ce lien le redirige vers une page qui retourne une erreur 401 (Non autorisé).

### Causes du problème

1. **Lien codé en dur** : Les liens dans les emails utilisaient `http://localhost:3000` au lieu de l'URL de production
2. **Routes protégées** : Les routes backend pour accéder aux réservations nécessitaient une authentification, empêchant les clients non connectés d'accéder à leurs propres réservations

## Corrections apportées

### 1. Frontend

#### Fichier : `frontend/src/components/BookingModal.jsx`
- **Changement** : Le lien dans l'email utilise maintenant la variable d'environnement `VITE_FRONTEND_URL`
- **Ligne 391** : Ajout de `const frontendUrl = import.meta.env.VITE_FRONTEND_URL || window.location.origin;`
- **Ligne 397** : Utilisation de `${frontendUrl}/client/my-booking/${booking.id}` au lieu de l'URL codée en dur

#### Fichier : `frontend/src/services/api.js`
- **Changement** : L'intercepteur ne redirige plus vers `/login` quand on est sur une page client publique
- **Ligne 36** : Ajout de la vérification `const isClientPage = window.location.pathname.startsWith('/client/');`
- **Ligne 39** : Ne redirige que si ce n'est ni Stripe ni une page client

#### Nouveau fichier : `frontend/.env.example`
- **Contenu** : Documentation des variables d'environnement nécessaires
  - `VITE_API_URL` : URL de l'API backend
  - `VITE_FRONTEND_URL` : URL du frontend (utilisée dans les emails)

### 2. Backend

#### Fichier : `backend/src/services/email.service.js`
- **Changement** : Le template d'email utilise maintenant `process.env.FRONTEND_URL`
- **Ligne 163** : Utilisation de `${process.env.FRONTEND_URL || 'http://localhost:3000'}/client/my-booking/${booking.id}`

#### Fichier : `backend/src/routes/booking.routes.js`
- **Changement** : Certaines routes sont maintenant publiques (sans authentification)
- **Routes publiques** :
  - `GET /:id` - Récupérer une réservation
  - `POST /` - Créer une réservation
  - `PUT /:id` - Mettre à jour une réservation
  - `POST /:id/cancel` - Annuler une réservation
- **Routes protégées** : Toutes les autres routes (paiements, déplacements, suppressions, notes)

#### Fichier : `backend/src/routes/participant.routes.js`
- **Changement** : Les routes d'accès aux participants sont maintenant publiques
- **Routes publiques** :
  - `GET /booking/:bookingId` - Récupérer les participants d'une réservation
  - `POST /booking/:bookingId` - Créer/Mettre à jour les participants
- **Routes protégées** : Synthèse des combinaisons, impression, suppression

#### Fichier : `backend/.env.example`
- **Changement** : Ajout de commentaires pour les URLs de production

## Configuration requise pour le déploiement

### Backend

Créer ou modifier le fichier `backend/.env` avec les valeurs de production :

```bash
# URLs de l'application
APP_URL=https://api.canyonlife.fr
FRONTEND_URL=https://canyonlife.fr
```

### Frontend

Créer ou modifier le fichier `frontend/.env` avec les valeurs de production :

```bash
# URL de l'API backend
VITE_API_URL=https://api.canyonlife.fr/api

# URL du frontend (utilisée dans les emails)
VITE_FRONTEND_URL=https://canyonlife.fr
```

## Déploiement

### 1. Backend

```bash
cd backend
# Mettre à jour le fichier .env avec les valeurs de production
npm install
npm run build  # si nécessaire
# Redémarrer le serveur
```

### 2. Frontend

```bash
cd frontend
# Mettre à jour le fichier .env avec les valeurs de production
npm install
npm run build
# Déployer le build sur votre serveur de production
```

## Tests à effectuer

1. **Test du lien email en local** :
   - Créer une réservation
   - Vérifier que l'email contient le bon lien (localhost:3000 en local)
   - Cliquer sur le lien et vérifier que la page se charge sans erreur 401

2. **Test du lien email en production** :
   - Créer une réservation en production
   - Vérifier que l'email contient le bon lien (canyonlife.fr)
   - Cliquer sur le lien et vérifier que la page se charge correctement

3. **Test d'accès sans authentification** :
   - Ouvrir une fenêtre de navigation privée
   - Accéder à `/client/my-booking/{bookingId}` avec un ID valide
   - Vérifier que la page se charge sans redirection vers `/login`

4. **Test de modification des participants** :
   - Sur la page client, modifier les informations des participants
   - Vérifier que la sauvegarde fonctionne sans erreur 401

## Sécurité

### Note importante

Les routes suivantes sont maintenant accessibles publiquement :
- Récupération d'une réservation par ID
- Modification d'une réservation
- Annulation d'une réservation
- Gestion des participants

**Recommandations de sécurité futures** :
1. Implémenter un système de token unique par réservation (similaire à un "magic link")
2. Limiter les modifications possibles depuis l'interface client
3. Ajouter une vérification par email pour les actions sensibles
4. Implémenter un rate limiting pour éviter les abus

Pour l'instant, le système repose sur l'obscurité des IDs de réservation (UUID), ce qui offre une protection basique mais non optimale pour une application en production à long terme.
