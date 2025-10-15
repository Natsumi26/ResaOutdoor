# 💳 Configuration Stripe pour les paiements

## Fonctionnalités Stripe

✅ **Paiement en ligne sécurisé** : Interface Stripe Checkout intégrée
✅ **Webhook automatique** : Confirmation de paiement en temps réel
✅ **Gestion des montants partiels** : Possibilité de payer le solde restant
✅ **Historique des paiements** : Tous les paiements sont enregistrés dans la base
✅ **Email automatique** : Email de confirmation après paiement réussi

## Configuration

### 1. Créer un compte Stripe

1. Allez sur https://stripe.com
2. Créez un compte (gratuit)
3. Activez votre compte en mode test

### 2. Récupérer les clés API

1. Connectez-vous à https://dashboard.stripe.com
2. Allez dans **Developers > API keys**
3. Copiez votre **Secret key** (commence par `sk_test_...`)
4. Mettez-la dans le fichier `.env` :

```env
STRIPE_SECRET_KEY=sk_test_51PxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxYrX
```

### 3. Configurer les URLs

Dans `.env`, configurez les URLs de votre application :

```env
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

### 4. Configurer le Webhook (Important pour la production)

Le webhook permet à Stripe de notifier votre backend quand un paiement est réussi.

#### En développement (avec Stripe CLI)

1. Installez Stripe CLI : https://stripe.com/docs/stripe-cli
2. Connectez-vous :
   ```bash
   stripe login
   ```
3. Écoutez les événements :
   ```bash
   stripe listen --forward-to localhost:5000/api/stripe/webhook
   ```
4. Copiez le webhook secret affiché (commence par `whsec_...`)
5. Ajoutez-le dans `.env` :
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxx
   ```

#### En production

1. Allez dans **Developers > Webhooks** sur le dashboard Stripe
2. Cliquez sur "Add endpoint"
3. URL : `https://votre-domaine.com/api/stripe/webhook`
4. Événements à écouter : `checkout.session.completed`, `payment_intent.payment_failed`
5. Copiez le webhook secret et mettez-le dans `.env`

## Utilisation

### Payer une réservation

1. **Depuis le BookingModal** :
   - Ouvrez une réservation
   - Si un solde est dû, un bouton vert "💳 Payer XXX€ avec Stripe" apparaît
   - Cliquez dessus pour être redirigé vers Stripe Checkout

2. **Processus de paiement** :
   - Vous êtes redirigé vers la page sécurisée Stripe
   - Entrez les informations de carte (en test, utilisez `4242 4242 4242 4242`)
   - Date d'expiration : n'importe quelle date future
   - CVC : n'importe quel 3 chiffres
   - Validez le paiement

3. **Après le paiement** :
   - Vous êtes redirigé vers votre application
   - Le webhook confirme le paiement en arrière-plan
   - Le paiement est enregistré automatiquement
   - Le statut de la réservation passe à "confirmed" si totalement payée
   - Un email de confirmation est envoyé

## Cartes de test

En mode test, utilisez ces numéros de carte :

| Carte | Numéro | Résultat |
|-------|--------|----------|
| Visa réussie | 4242 4242 4242 4242 | Paiement réussi |
| Visa refusée | 4000 0000 0000 0002 | Paiement refusé |
| 3D Secure requis | 4000 0027 6000 3184 | Authentification requise |

Plus de cartes de test : https://stripe.com/docs/testing

## Workflow du paiement

```
1. Client clique sur "Payer avec Stripe"
   ↓
2. Backend crée une session Stripe Checkout
   - Montant : solde restant de la réservation
   - Produit : nom du canyon + date
   - Client : email pré-rempli
   ↓
3. Client est redirigé vers Stripe Checkout
   ↓
4. Client entre ses informations de carte
   ↓
5. Stripe traite le paiement
   ↓
6. Si succès : redirection vers /payment/success
   ↓
7. Webhook reçu par le backend :
   - Création d'une entrée Payment dans la BDD
   - Mise à jour du montant payé
   - Mise à jour du statut si totalement payé
   - Ajout à l'historique de la réservation
   ↓
8. Email de confirmation envoyé au client
```

## API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/stripe/create-checkout-session` | POST | Créer une session de paiement |
| `/api/stripe/verify-payment/:sessionId` | GET | Vérifier un paiement |
| `/api/stripe/webhook` | POST | Webhook Stripe (raw body) |

## Sécurité

- ✅ **Clés secrètes** : Jamais exposées côté client
- ✅ **Webhook signature** : Vérification avec `STRIPE_WEBHOOK_SECRET`
- ✅ **HTTPS** : Obligatoire en production
- ✅ **PCI Compliance** : Géré par Stripe, pas de données de carte stockées

## Gestion des erreurs

### "Invalid API key"
- Vérifiez que `STRIPE_SECRET_KEY` est bien configuré
- Vérifiez que vous utilisez la bonne clé (test vs live)

### "Webhook signature verification failed"
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- En développement : utilisez Stripe CLI
- En production : créez le webhook sur le dashboard

### "Payment not recorded"
- Vérifiez les logs du serveur
- Vérifiez que le webhook est bien configuré
- Testez avec Stripe CLI en développement

## Passage en production

1. **Activez votre compte Stripe** :
   - Fournissez les informations légales de votre entreprise
   - Activez les paiements live

2. **Changez les clés** :
   - Utilisez la clé live (`sk_live_...`)
   - Configurez le webhook en production

3. **Configurez HTTPS** :
   - Obligatoire pour les webhooks Stripe
   - Utilisez Let's Encrypt ou un certificat SSL

4. **Testez** :
   - Faites un paiement test réel (petit montant)
   - Vérifiez que tout fonctionne
   - Remboursez le paiement test depuis le dashboard

## Tarifs Stripe

- **Frais par transaction** : 1,4% + 0,25€ (cartes européennes)
- **Pas d'abonnement mensuel**
- **Pas de frais cachés**

Plus d'infos : https://stripe.com/fr/pricing

## Support

- Documentation officielle : https://stripe.com/docs
- Stripe CLI : https://stripe.com/docs/stripe-cli
- Support : support@stripe.com

📚 Guide complet : Gestion des comptes Stripe par guide
Situation actuelle
Votre application est déjà configurée pour utiliser Stripe Connect ! Voici comment cela fonctionne :
1. Architecture
┌─────────────────────────────────────────────────┐
│  Votre Compte Stripe (Plateforme)              │
│  STRIPE_SECRET_KEY dans .env                    │
│  - Gère tous les paiements                      │
│  - Redistribue aux guides via Connect           │
└─────────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼──────┐         ┌──────▼───────┐
│ Guide 1      │         │ Guide 2      │
│ stripeAccount│         │ stripeAccount│
│ = acct_ABC   │         │ = acct_XYZ   │
└──────────────┘         └──────────────┘
2. Quel accountId utiliser ?
Il y a 2 types d'accountId :
A. Compte Plateforme (VOUS)
Format : Clé secrète sk_test_xxx ou sk_live_xxx
Où : Dans votre fichier .env comme STRIPE_SECRET_KEY
Utilisation : Pour gérer tous les comptes Connect
Vous l'avez déjà !
B. Compte Connect (CHAQUE GUIDE)
Format : acct_ + caractères alphanumériques (ex: acct_1NvF2gJZ3mKv8jP4)
Où : Stocké dans User.stripeAccount (base de données)
Utilisation : Pour router les paiements vers le bon guide
Obtenu automatiquement via l'onboarding
3. Comment un guide obtient son accountId ?
Votre application a déjà tout en place ! Voici le processus :
Étape 1: Guide se connecte et va dans "Paramètres"
         ↓
Étape 2: Clique sur "🔗 Connecter mon compte Stripe"
         ↓
Étape 3: Backend appelle createConnectAccountLink()
         qui crée automatiquement un accountId Stripe
         ↓
Étape 4: Backend sauvegarde accountId dans user.stripeAccount
         ↓
Étape 5: Guide est redirigé vers Stripe pour compléter son profil
         (infos bancaires, identité, etc.)
         ↓
Étape 6: Guide revient sur l'application
         Status: ✅ Compte actif ou ⚠️ Configuration en attente
         ↓
Étape 7: Les paiements pour ses sessions vont directement
         sur son compte Stripe (pas besoin de redistribution manuelle)
4. Flux de paiement avec accountId
Quand un client paie pour une session d'un guide :
// Dans stripe.service.js (ligne 49-56)
if (session.guide && session.guide.stripeAccount) {
  // Le guide a configuré son compte Stripe
  sessionConfig.payment_intent_data = {
    transfer_data: {
      destination: session.guide.stripeAccount  // Ex: acct_ABC123
    }
  };
  // ➡️ Le paiement va DIRECTEMENT sur le compte du guide
}
// Sinon, le paiement reste sur le compte plateforme
5. États possibles du stripeAccount
État	Valeur dans BDD	Signification	Action
Non connecté	null	Guide n'a jamais connecté Stripe	Bouton "Connecter" visible
En cours	acct_xxx + details_submitted: false	Compte créé mais pas configuré	Bouton "Compléter" visible
Actif	acct_xxx + charges_enabled: true	Compte totalement configuré	Peut recevoir des paiements
Suspendu	acct_xxx + charges_enabled: false	Problème avec le compte	Contacter Stripe
6. Où trouver l'accountId d'un guide
Option A : Dans la base de données
SELECT login, stripeAccount FROM users;
Résultat exemple :
guide1 | acct_1NvF2gJZ3mKv8jP4
guide2 | null
guide3 | acct_1PxR4kLM6nKw9sQ7
Option B : Dans l'interface admin (Users)
Votre page Users.jsx affiche déjà le stripeAccount de chaque utilisateur.
Option C : Dans le dashboard Stripe
Allez sur https://dashboard.stripe.com/connect/accounts
Vous verrez tous les comptes Connect créés
Chaque compte a un ID commençant par acct_
7. Dois-je saisir manuellement l'accountId ?
NON ! C'est automatique :
❌ Ne saisissez PAS manuellement l'accountId
✅ Laissez le système créer le compte via l'onboarding
✅ Le backend sauvegarde automatiquement l'accountId dans la BDD
8. Configuration pour votre environnement
Environnement de développement (test)
Dans votre .env :
# Compte plateforme (VOUS)
STRIPE_SECRET_KEY=sk_test_51PxxxxxxxxxxxxxxxxxxxxxxxxxxxxYrX

# URLs
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:5000

# Webhook (optionnel en dev)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
Les guides auront des accountId de test : acct_xxxxxxxxxxxxx
Environnement de production (live)
Dans votre .env de production :
# Compte plateforme (VOUS) - LIVE
STRIPE_SECRET_KEY=sk_live_51PxxxxxxxxxxxxxxxxxxxxxxxxxxxxYrX

# URLs de production
FRONTEND_URL=https://votre-domaine.com
APP_URL=https://api.votre-domaine.com

# Webhook de production
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
Les guides auront des accountId live : acct_xxxxxxxxxxxxx ⚠️ Important : En passant de test à live, les guides devront reconnecter leurs comptes Stripe (les accountId de test ne fonctionnent pas en live).
9. Vérifier que tout fonctionne
Pour tester le système :
Connectez-vous en tant que guide (pas admin)
Allez dans Paramètres
Cliquez sur "Connecter mon compte Stripe"
Suivez le processus Stripe (en test, pas besoin de vraies infos bancaires)
Vérifiez que le stripeAccount est bien enregistré dans la base de données
Créez une session pour ce guide
Faites un paiement test (carte 4242 4242 4242 4242)
Vérifiez dans le dashboard Stripe que le paiement est allé sur le bon compte
10. FAQ
Q : Puis-je utiliser le même compte Stripe pour tous les guides ? R : Non, chaque guide doit avoir son propre compte Connect pour des raisons légales et fiscales. Q : Les guides peuvent-ils voir les paiements des autres guides ? R : Non, chaque guide ne voit que ses propres transactions dans son dashboard Stripe. Q : Que se passe-t-il si un guide n'a pas configuré Stripe ? R : Le paiement reste sur votre compte plateforme et vous devrez le redistribuer manuellement. Q : Y a-t-il des frais supplémentaires pour Stripe Connect ? R : Non, les frais Stripe sont les mêmes (1,4% + 0,25€ par transaction européenne). Q : Puis-je prendre une commission sur les paiements ? R : Oui, en modifiant le code pour utiliser application_fee_amount au lieu de transfer_data.
Résumé :
Vous n'avez rien à saisir manuellement
Le système crée automatiquement les accountId via l'onboarding
Chaque guide configure son propre compte Stripe
Les paiements sont automatiquement routés vers le bon guide