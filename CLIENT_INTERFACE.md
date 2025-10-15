# 🏔️ Interface Client - Système de Réservation de Canyons

## Vue d'ensemble

L'interface client permet aux visiteurs de votre site WordPress de rechercher, consulter et réserver des canyons directement via une iframe intégrée.

## 📋 Pages créées

### 1. **Page de Recherche** (`/client/search`)
Permet aux clients de trouver le canyon idéal.

**Fonctionnalités :**
- Filtres de recherche :
  - Région (Annecy / Grenoble)
  - Niveau (Découverte / Aventure / Sportif)
  - Durée minimale et maximale
  - Date souhaitée (vérifie la disponibilité en temps réel)
- Affichage en cards avec :
  - Photo du canyon
  - Nom et description courte
  - Niveau, durée, région, capacité
  - Prix à partir de X€/personne
  - Bouton "Réserver"
- Réinitialisation des filtres

**Accès :** `http://localhost:5173/client/search`

---

### 2. **Page Détails Canyon** (`/client/canyon/:id`)
Affiche tous les détails d'un canyon spécifique.

**Fonctionnalités :**
- Galerie photos (défilement avec miniatures)
- Informations détaillées :
  - Description complète
  - Niveau, durée, région
  - Capacité maximale
  - Prix individuel et prix de groupe
- Équipement fourni
- Liens utiles (Waze, Google Maps, site web)
- Calendrier de réservation :
  - Sélection de la date (14 jours à venir)
  - Liste des sessions disponibles
  - Informations guide
  - Places disponibles
  - Option location de chaussures
  - Bouton "Réserver" par session

**Accès :** `http://localhost:5173/client/canyon/[ID_PRODUIT]`

---

### 3. **Formulaire de Réservation** (`/client/book/:sessionId`)
Permet de réserver une session.

**Fonctionnalités :**
- Résumé de la session :
  - Canyon, date, horaire
  - Photo
  - Détail du prix en temps réel
- Formulaire client :
  - Nombre de personnes (avec calcul prix groupe)
  - Nom, email, téléphone
  - Location de chaussures (si disponible)
  - Code bon cadeau (avec vérification)
- Formulaire participants (optionnel) :
  - Nom, poids, taille, pointure
  - Peut être rempli maintenant ou plus tard
- Choix du mode de paiement :
  - **Payer en ligne** : redirection vers Stripe
  - **Payer sur place** : réservation enregistrée sans paiement
- Calcul automatique du prix :
  - Prix individuel ou groupe
  - Location de chaussures
  - Déduction bon cadeau

**Accès :** `http://localhost:5173/client/book/[ID_SESSION]`

---

### 4. **Page de Confirmation** (`/client/booking-confirmation/:bookingId`)
Affichée après une réservation réussie.

**Fonctionnalités :**
- Message de succès
- Détails de la réservation :
  - Numéro de réservation
  - Canyon, date, horaire
  - Nombre de personnes
  - Prix et montant payé
- Informations client
- Prochaines étapes :
  - Email de confirmation envoyé
  - Lien pour payer le solde (si non payé)
  - Lien pour remplir les infos participants
  - Message du guide
- Liens vers le lieu de rendez-vous (Waze/Maps)
- Boutons :
  - "Gérer ma réservation"
  - "Réserver une autre activité"

**Accès :** `http://localhost:5173/client/booking-confirmation/[ID_RESERVATION]`

---

### 5. **Page Ma Réservation** (`/client/my-booking/:bookingId`)
Permet au client de gérer sa réservation.

**Fonctionnalités :**
- Détails de la réservation
- Statut du paiement :
  - Payée (vert)
  - En attente (orange)
  - Annulée (rouge)
- Paiement du solde :
  - Affichage du montant restant
  - Bouton "Payer le solde" (redirection Stripe)
- Gestion des participants :
  - Affichage des infos existantes
  - Bouton "Modifier" / "Remplir"
  - Formulaire d'édition (nom, poids, taille, pointure)
  - Avertissement si non rempli
  - Enregistrement en temps réel
- Informations de contact
- Message du guide
- Liens vers le lieu de rendez-vous
- Bouton d'annulation de réservation

**Accès :** `http://localhost:5173/client/my-booking/[ID_RESERVATION]`

---

## 🎨 Design et UX

### Caractéristiques
- Design moderne et responsive
- Optimisé pour mobile, tablette et desktop
- Adapté pour intégration en iframe WordPress
- Couleurs cohérentes avec le dashboard admin
- Cards interactives avec effets hover
- Badges de niveau colorés (Découverte=vert, Aventure=orange, Sportif=rouge)

### Responsive
Tous les affichages s'adaptent automatiquement :
- **Desktop** : grilles multi-colonnes, sidebars
- **Tablette** : colonnes réduites
- **Mobile** : affichage en colonne unique

---

## 🔗 Intégration WordPress

### Via iframe
Ajoutez ce code dans vos pages WordPress :

```html
<!-- Page de recherche -->
<iframe
  src="http://localhost:5173/client/search"
  width="100%"
  height="1200px"
  frameborder="0"
  style="border: none;"
></iframe>

<!-- Page détails (remplacer ID_PRODUIT) -->
<iframe
  src="http://localhost:5173/client/canyon/ID_PRODUIT"
  width="100%"
  height="1500px"
  frameborder="0"
  style="border: none;"
></iframe>
```

### Via shortcode WordPress (option avancée)
Créez un shortcode personnalisé dans `functions.php` :

```php
function canyon_booking_iframe($atts) {
    $atts = shortcode_atts(array(
        'page' => 'search',
        'id' => ''
    ), $atts);

    $base_url = 'https://votre-domaine.com/client/';
    $url = $base_url . $atts['page'];

    if ($atts['id']) {
        $url .= '/' . $atts['id'];
    }

    return '<iframe src="' . esc_url($url) . '" width="100%" height="1200px" frameborder="0" style="border: none;"></iframe>';
}
add_shortcode('canyon_booking', 'canyon_booking_iframe');
```

Utilisation :
```
[canyon_booking page="search"]
[canyon_booking page="canyon" id="abc123"]
```

---

## 🔄 Flux utilisateur complet

```
1. Client arrive sur /client/search
   ↓
2. Filtre par région, niveau, durée, date
   ↓
3. Clique sur "Réserver" sur un canyon
   ↓
4. Redirigé vers /client/canyon/[ID]
   ↓
5. Consulte les détails et la galerie photos
   ↓
6. Sélectionne une date dans le calendrier
   ↓
7. Choisit une session disponible
   ↓
8. Clique sur "Réserver"
   ↓
9. Redirigé vers /client/book/[SESSION_ID]
   ↓
10. Remplit ses informations
    ↓
11a. Choisit "Payer en ligne"
     → Redirection Stripe
     → Paiement
     → Retour sur confirmation

11b. Choisit "Payer sur place"
     → Réservation enregistrée
     → Redirection confirmation
     ↓
12. Page de confirmation /client/booking-confirmation/[ID]
    → Email envoyé automatiquement
    → Lien vers "Gérer ma réservation"
    ↓
13. Client peut accéder à /client/my-booking/[ID]
    → Payer le solde si nécessaire
    → Remplir/modifier infos participants
    → Annuler la réservation
```

---

## 📧 Emails automatiques

Les emails suivants sont envoyés automatiquement :

1. **Confirmation de réservation**
   - Envoyé après création de la réservation
   - Contient :
     - Numéro de réservation
     - Détails de la session
     - Lien vers la page "Ma réservation"
     - Informations de paiement

2. **Confirmation de paiement**
   - Envoyé après un paiement Stripe réussi
   - Contient le reçu et le montant payé

3. **Rappel avant session**
   - Envoyé X jours avant la session (configurable)
   - Rappel des infos participants à remplir

---

## 🎯 Points importants

### Sécurité
- Aucune authentification requise (accessibilité publique)
- Validation côté serveur de toutes les données
- Protection CSRF via tokens
- Paiement sécurisé par Stripe (PCI-DSS compliant)

### Performance
- Lazy loading des images
- Pagination des résultats
- Cache des requêtes API
- Optimisation des re-renders React

### SEO (si non-iframe)
- Meta tags dynamiques
- URLs sémantiques
- Sitemap XML générable
- Schema.org markup pour les activités

---

## 🛠️ Configuration

### Variables d'environnement (.env)

```env
# Frontend
VITE_API_URL=http://localhost:5000/api

# Backend
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:5000
```

### En production

```env
# Frontend
VITE_API_URL=https://api.votre-domaine.com/api

# Backend
STRIPE_SECRET_KEY=sk_live_...
FRONTEND_URL=https://booking.votre-domaine.com
APP_URL=https://api.votre-domaine.com
```

---

## 🧪 Tests

### Tests manuels recommandés

1. **Recherche**
   - [ ] Tous les filtres fonctionnent
   - [ ] Reset des filtres
   - [ ] Affichage responsive

2. **Détails**
   - [ ] Galerie photos défile
   - [ ] Calendrier charge les sessions
   - [ ] Bouton réserver fonctionne

3. **Réservation**
   - [ ] Calcul du prix correct
   - [ ] Prix groupe appliqué
   - [ ] Bon cadeau fonctionne
   - [ ] Formulaire participants sauvegardé
   - [ ] Paiement Stripe fonctionne
   - [ ] Paiement sur place fonctionne

4. **Ma Réservation**
   - [ ] Affichage correct
   - [ ] Modification participants
   - [ ] Paiement solde
   - [ ] Annulation

---

## 📱 Compatibilité navigateurs

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile iOS Safari
- ✅ Mobile Chrome Android

---

## 🚀 Déploiement

### Build de production

```bash
cd frontend
npm run build
```

Le dossier `dist/` contient les fichiers à déployer.

### Serveur recommandé
- **Nginx** ou **Apache** pour servir les fichiers statiques
- **Node.js** pour le backend API
- **PostgreSQL** pour la base de données
- **Redis** (optionnel) pour le cache

---

## 💡 Améliorations futures possibles

1. **Fonctionnalités**
   - Recherche par mot-clé
   - Tri des résultats (prix, durée, popularité)
   - Favoris / Wishlist
   - Comparateur de canyons
   - Avis et notes clients
   - Photos uploadées par les clients
   - Partage sur réseaux sociaux

2. **Intégrations**
   - Google Calendar
   - Mailchimp pour newsletter
   - WhatsApp pour notifications
   - Facebook Pixel pour tracking

3. **Performance**
   - PWA (Progressive Web App)
   - Service Worker pour offline
   - Push notifications
   - Compression d'images automatique

---

## 📞 Support

Pour toute question ou problème :
- Consultez la documentation technique dans `/docs`
- Vérifiez les logs backend : `backend/logs/`
- Testez avec les cartes de test Stripe : `4242 4242 4242 4242`

---

**Interface client créée avec ❤️ pour CanyonLife**
