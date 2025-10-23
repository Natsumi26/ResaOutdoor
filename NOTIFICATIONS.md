# 🔔 Système de Notifications en Temps Réel

Ce document décrit le système de notifications en temps réel implémenté avec Socket.io.

## Vue d'ensemble

Le système de notifications permet aux administrateurs de recevoir des alertes instantanées lorsque des événements importants se produisent, comme :
- Nouvelle réservation
- Modification de réservation
- Annulation de réservation
- Paiement reçu

## Architecture

### Backend

#### 1. Configuration Socket.io ([server.js:75-108](backend/src/server.js#L75-L108))

Le serveur Socket.io est configuré avec CORS pour accepter les connexions du frontend :

```javascript
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

#### 2. Service de Notifications ([notification.service.js](backend/src/services/notification.service.js))

Le service centralise l'envoi de notifications :

- `notifyAdmins(notification)` : Envoie une notification à tous les admins connectés
- `notifyClient(userId, notification)` : Envoie une notification à un client spécifique
- `updateCalendar(data)` : Met à jour le calendrier en temps réel

**Types de notifications disponibles :**
- `NEW_BOOKING` : Nouvelle réservation
- `BOOKING_UPDATED` : Réservation modifiée
- `BOOKING_CANCELLED` : Réservation annulée
- `PAYMENT_RECEIVED` : Paiement reçu
- `NEW_MESSAGE` : Nouveau message

#### 3. Intégration dans les Routes

Les notifications sont envoyées automatiquement depuis les contrôleurs de réservation :

**Création de réservation** ([booking.controller.js:352-367](backend/src/controllers/booking.controller.js#L352-L367))
```javascript
const notification = createNewBookingNotification({
  id: booking.id,
  clientName: `${clientFirstName} ${clientLastName}`,
  productName: booking.product.name,
  sessionDate: booking.session.date,
  totalAmount: totalPrice
});
notifyAdmins(notification);
```

**Annulation** ([booking.controller.js:543-557](backend/src/controllers/booking.controller.js#L543-L557))
```javascript
const notification = createBookingCancelledNotification({
  id: booking.id,
  clientName: `${booking.clientFirstName} ${booking.clientLastName}`,
  productName: booking.product.name,
  cancellationReason: 'Annulation par le client'
});
notifyAdmins(notification);
```

### Frontend

#### 1. Context de Notifications ([NotificationContext.jsx](frontend/src/contexts/NotificationContext.jsx))

Le contexte gère :
- Connexion Socket.io
- État des notifications
- Compteur de notifications non lues
- Fonctions pour marquer comme lu/supprimer

**Hooks disponibles :**
```javascript
const {
  socket,              // Instance Socket.io
  notifications,       // Liste des notifications
  unreadCount,        // Nombre de non lues
  isConnected,        // Statut de connexion
  markAsRead,         // Marquer une notification comme lue
  markAllAsRead,      // Tout marquer comme lu
  removeNotification, // Supprimer une notification
  clearAll           // Effacer toutes les notifications
} = useNotifications();
```

#### 2. Composant NotificationBell ([NotificationBell.jsx](frontend/src/components/NotificationBell.jsx))

Affiche :
- Icône de cloche avec badge de compteur
- Menu déroulant avec liste des notifications
- Actions (marquer tout lu, effacer tout)

#### 3. Composant NotificationToast ([NotificationToast.jsx](frontend/src/components/NotificationToast.jsx))

Affiche des toasts temporaires (5 secondes) pour les nouvelles notifications :
- Animation de glissement depuis la droite
- Icône selon le type de notification
- Couleur selon la priorité (high, medium, normal)
- Bouton de fermeture

## Utilisation

### Tester les Notifications

1. **Démarrer les serveurs :**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Se connecter en tant qu'admin :**
   - Ouvrir http://localhost:3000
   - Se connecter avec un compte admin

3. **Créer une réservation :**
   - Ouvrir une fenêtre incognito ou un autre navigateur
   - Aller sur http://localhost:3000/client/search
   - Créer une nouvelle réservation

4. **Observer les notifications :**
   - Sur le dashboard admin, vous devriez voir :
     - Un toast apparaître en haut à droite
     - Le badge de la cloche s'incrémenter
     - La notification dans la liste

### Ajouter de Nouveaux Types de Notifications

1. **Ajouter le type dans le service backend :**

```javascript
// backend/src/services/notification.service.js
export const NotificationTypes = {
  // ...existants
  NEW_TYPE: 'new-type'
};

export const createNewTypeNotification = (data) => {
  return {
    type: NotificationTypes.NEW_TYPE,
    title: 'Titre de la notification',
    message: `Message avec ${data.info}`,
    data: data,
    priority: 'normal' // high, medium, normal
  };
};
```

2. **Utiliser dans le contrôleur :**

```javascript
import { notifyAdmins, createNewTypeNotification } from '../services/notification.service.js';

// Dans votre fonction
const notification = createNewTypeNotification({ info: 'test' });
notifyAdmins(notification);
```

3. **Ajouter l'icône dans le frontend :**

```javascript
// frontend/src/components/NotificationBell.jsx
const getNotificationIcon = (type) => {
  switch (type) {
    // ...existants
    case 'new-type':
      return '🎉';
    default:
      return '🔔';
  }
};
```

## Événements Socket.io

### Backend → Frontend

| Événement | Description | Données |
|-----------|-------------|---------|
| `notification` | Nouvelle notification | `{ id, type, title, message, data, priority, timestamp, read }` |
| `calendar-update` | Mise à jour du calendrier | `{ action, bookingId, sessionId }` |

### Frontend → Backend

| Événement | Description | Données |
|-----------|-------------|---------|
| `join-room` | Rejoindre une room | `{ role: 'admin' \| 'client', userId }` |

## Notifications Navigateur

Le système supporte les notifications natives du navigateur :

1. **Permission demandée automatiquement** au premier chargement
2. **Affichage des notifications** même si l'onglet n'est pas actif
3. **Icône et badge** personnalisables

Pour désactiver les notifications navigateur, l'utilisateur peut le faire via les paramètres de son navigateur.

## Personnalisation

### Modifier la durée des toasts

Dans [NotificationToast.jsx:29](frontend/src/components/NotificationToast.jsx#L29) :

```javascript
setTimeout(() => {
  setVisibleToasts(prev => prev.filter(t => t.id !== latestNotification.id));
}, 5000); // Changer 5000 (5 secondes)
```

### Ajouter un son personnalisé

Placer un fichier audio dans `/public/notification-sound.mp3` ou modifier [NotificationContext.jsx:124](frontend/src/contexts/NotificationContext.jsx#L124) :

```javascript
const audio = new Audio('/votre-son.mp3');
```

### Changer les couleurs des priorités

Dans [NotificationBell.css:90-102](frontend/src/components/NotificationBell.css#L90-L102) :

```css
.notification-item.notification-high {
  border-left: 4px solid #e74c3c; /* Rouge */
}

.notification-item.notification-medium {
  border-left: 4px solid #f39c12; /* Orange */
}

.notification-item.notification-normal {
  border-left: 4px solid #3498db; /* Bleu */
}
```

## Rooms Socket.io

Le système utilise des "rooms" pour cibler les notifications :

- **`admins`** : Tous les administrateurs connectés
- **`client-{userId}`** : Un client spécifique (pour notifications personnalisées futures)

## Mise à Jour Automatique du Calendrier

Le calendrier peut écouter les événements de mise à jour :

```javascript
// Dans votre composant calendrier
useEffect(() => {
  const handleCalendarUpdate = (event) => {
    console.log('Calendrier mis à jour:', event.detail);
    // Recharger les données
    fetchBookings();
  };

  window.addEventListener('calendar-update', handleCalendarUpdate);
  return () => window.removeEventListener('calendar-update', handleCalendarUpdate);
}, []);
```

## Débogage

### Backend

Les logs de connexion/déconnexion s'affichent dans la console :
```
👤 Client connecté: AbCdEf123
👨‍💼 Admin 1 a rejoint la room admins
📢 Notification envoyée aux admins: new-booking
👋 Client déconnecté: AbCdEf123
```

### Frontend

Ouvrir la console du navigateur pour voir :
```
✅ Connecté au serveur de notifications
🔔 Nouvelle notification reçue: { type: 'new-booking', ... }
```

## Sécurité

- Les rooms sont séparées par rôle (admin/client)
- Authentification via le contexte Auth avant connexion Socket.io
- CORS configuré pour n'accepter que le frontend autorisé
- Pas de données sensibles dans les notifications (seulement IDs et infos publiques)

## Performance

- Les notifications sont stockées en mémoire côté client (pas de base de données)
- Limite de 3 toasts simultanés maximum
- Reconnexion automatique en cas de déconnexion
- Pas de polling, communication bidirectionnelle efficace

## Prochaines Améliorations Possibles

- [ ] Persistence des notifications en base de données
- [ ] Préférences de notification par utilisateur
- [ ] Filtres de notifications (par type, priorité)
- [ ] Historique complet des notifications
- [ ] Notifications pour les clients (rappels de session, etc.)
- [ ] Notifications par email si l'utilisateur est déconnecté
- [ ] Intégration avec service de push notifications mobiles (PWA)
