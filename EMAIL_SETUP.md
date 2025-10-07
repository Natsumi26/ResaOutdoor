# 📧 Configuration de l'envoi d'emails

## Fonctionnalités Email

✅ **Email de confirmation automatique** : Envoyé automatiquement lors de la création d'une réservation
✅ **Email manuel** : Bouton "Envoyer email" dans le BookingModal
✅ **Email de rappel** : API disponible pour envoyer un rappel 24h avant la session
✅ **Email personnalisé** : API pour envoyer des emails custom

## Configuration Gmail (Recommandé pour le développement)

### 1. Activer l'authentification à 2 facteurs

1. Allez sur https://myaccount.google.com/security
2. Activez "Validation en deux étapes"

### 2. Créer un mot de passe d'application

1. Allez sur https://myaccount.google.com/apppasswords
2. Sélectionnez "Autre (nom personnalisé)"
3. Entrez "Canyon Life" ou "Booking App"
4. Cliquez sur "Générer"
5. Copiez le mot de passe de 16 caractères

### 3. Configurer le fichier .env

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx  # Mot de passe d'application
EMAIL_FROM="Canyon Life <votre-email@gmail.com>"
```

## Configuration pour la production

Pour la production, utilisez un service professionnel :

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=votre-api-key-sendgrid
EMAIL_FROM="Canyon Life <noreply@canyonlife.com>"
```

### Mailgun

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=postmaster@votre-domaine.mailgun.org
SMTP_PASS=votre-password-mailgun
EMAIL_FROM="Canyon Life <noreply@canyonlife.com>"
```

## Templates d'emails

### Email de confirmation

Envoyé automatiquement à chaque nouvelle réservation. Contient :
- Détails de l'activité (nom, date, heure, guide)
- Nombre de personnes
- Prix total et montant payé
- Message personnalisé du produit (si configuré)
- Liens Waze et Google Maps (si configurés)

### Email de rappel

Pour envoyer un rappel 24h avant la session :

```javascript
POST /api/email/booking-reminder/:bookingId
```

### Email personnalisé

Pour envoyer un email custom :

```javascript
POST /api/email/custom
{
  "to": "client@example.com",
  "subject": "Sujet de l'email",
  "content": "<h1>Contenu HTML</h1>"
}
```

## Test des emails

En développement, les emails sont envoyés via votre compte Gmail configuré. Vous recevrez les emails sur l'adresse du client.

### Tester sans configuration SMTP

Si vous ne voulez pas configurer SMTP, commentez la fonction `sendBookingConfirmation` dans `booking.controller.js` :

```javascript
// sendBookingConfirmation(booking).catch(err => {
//   console.error('Erreur envoi email de confirmation:', err);
// });
```

## Dépannage

### Erreur "Invalid login"

- Vérifiez que l'authentification à 2 facteurs est activée
- Vérifiez que vous utilisez un mot de passe d'application (pas votre mot de passe Gmail)
- Vérifiez que SMTP_USER et SMTP_PASS sont corrects dans .env

### Emails non reçus

- Vérifiez les spams
- Vérifiez que l'email du client est correct
- Consultez les logs du serveur pour voir les erreurs

### Erreur "Connection timeout"

- Vérifiez que le port 587 n'est pas bloqué par votre firewall
- Essayez avec SMTP_PORT=465 et SMTP_SECURE=true

## Personnalisation des templates

Les templates se trouvent dans `backend/src/services/email.service.js`.

Pour modifier le design :
1. Éditez les fonctions `bookingConfirmationTemplate()` ou `bookingConfirmationText()`
2. Redémarrez le serveur
3. Testez en créant une réservation ou en cliquant sur "Envoyer email"

## API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/email/booking-confirmation/:id` | POST | Envoyer email de confirmation |
| `/api/email/booking-reminder/:id` | POST | Envoyer email de rappel |
| `/api/email/custom` | POST | Envoyer email personnalisé |

Tous les endpoints nécessitent une authentification JWT.
