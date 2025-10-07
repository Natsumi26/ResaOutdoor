# 🧪 Guide de Test - Modale de Réservation

## 1. Préparer les données

```bash
# Dans le terminal backend
cd backend
npm run prisma:seed
```

Résultat attendu :
```
✅ Sessions créées: 18
✅ Réservations créées: 8
```

## 2. Démarrer les serveurs

**Terminal 1 - Backend :**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

## 3. Tester la modale

### Étape 1 : Se connecter
- Aller sur `http://localhost:3000` (ou le port affiché)
- Login : `canyonlife`
- Mot de passe : `canyonlife`

### Étape 2 : Accéder au calendrier
- Cliquer sur "Calendrier" dans le menu

### Étape 3 : Identifier les badges
Vous devriez voir des **badges colorés** dans les sessions :
- 🟢 **Vert** = Payé complètement (Jean Dupont)
- 🟠 **Orange** = Partiellement payé (Marie Martin)
- 🔴 **Rouge** = Non payé

### Étape 4 : Ouvrir la modale
**CLIQUER** sur un badge coloré → La modale s'ouvre !

## 4. Vérifier les fonctionnalités

### ✅ Onglet Informations
- [ ] Nom : Jean Dupont ou Marie Martin
- [ ] Email affiché
- [ ] Téléphone affiché
- [ ] Activité et date affichées
- [ ] Barre de progression paiement

### ✅ Onglet Paiements
- [ ] Liste des paiements existants
- [ ] Bouton "+ Ajouter un paiement"
- [ ] Formulaire fonctionnel
- [ ] Ajout d'un nouveau paiement

### ✅ Onglet Historique
- [ ] Timeline affichée
- [ ] Actions (created, payment)
- [ ] Dates affichées

### ✅ Actions
- [ ] Bouton "Annuler réservation" fonctionne
- [ ] Confirmation demandée
- [ ] Bouton "Fermer" ferme la modale

## 🐛 Problèmes possibles

### La modale ne s'ouvre pas

**Vérification 1 : Y a-t-il des badges ?**
```bash
# Vérifier dans la console navigateur (F12)
# Si erreur, relancer le seed
cd backend
npm run prisma:seed
```

**Vérification 2 : Console navigateur**
- Appuyer sur F12
- Onglet "Console"
- Regarder les erreurs en rouge

**Vérification 3 : Backend répond**
```bash
# Tester l'API directement
curl http://localhost:5000/api/sessions
```

### Erreur 401 (Non autorisé)
- Se reconnecter
- Vider le localStorage (F12 → Application → Local Storage → Clear)
- Se reconnecter

### Erreur "Cannot read property..."
- Rafraîchir la page (F5)
- Vérifier que le backend tourne

## 📸 À quoi ça devrait ressembler

### Calendrier
```
Jeudi 21/06
┌──────────┬──────────┐
│ MATIN    │ APRÈS... │
│ [2 🟢JD] │ [3 🟠MM] │ ← Cliquez ici !
└──────────┴──────────┘
```

### Modale ouverte
```
┌─────────────────────────────┐
│ Réservation #abc... [Confirmée] │
├─────────────────────────────┤
│ [📋 Infos] [💳 Paie] [...] │
├─────────────────────────────┤
│ 👤 Jean Dupont              │
│ 📧 jean.dupont@...          │
│ ...                         │
└─────────────────────────────┘
```

## 🎯 Test complet

1. ✅ Cliquer sur badge vert "Jean Dupont"
2. ✅ Vérifier infos client
3. ✅ Aller sur onglet "Paiements"
4. ✅ Voir le paiement de 100€ en CB
5. ✅ Aller sur onglet "Historique"
6. ✅ Voir les 2 actions
7. ✅ Cliquer "Fermer"
8. ✅ Cliquer sur badge orange "Marie Martin"
9. ✅ Voir qu'il reste 100€ à payer
10. ✅ Cliquer "+ Ajouter un paiement"
11. ✅ Ajouter 50€ en Espèces
12. ✅ Vérifier que reste = 50€

Si tout fonctionne → ✅ Modale OK !
