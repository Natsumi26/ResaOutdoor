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
