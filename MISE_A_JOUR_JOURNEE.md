# 🔄 Mise à jour - Ajout du créneau "Journée"

## Changements effectués

### ✅ Frontend
1. **WeeklyCalendar.jsx** - Ajout de la ligne "Journée" sous Matin/Après-midi
2. **WeeklyCalendar.module.css** - Styles pour la nouvelle ligne
3. Support du créneau `timeSlot: "journée"`

### ✅ Backend
1. **schema.prisma** - Commentaire mis à jour pour inclure "journée"
2. **seed.js** - Ajout de produits et sessions d'exemple avec créneau "journée"

## 📋 Commandes à exécuter

### 1. Appliquer les changements à la base de données

```bash
cd backend

# Créer une migration pour mettre à jour le schéma
npm run prisma:migrate

# Ou utiliser push en développement (plus rapide)
npx prisma db push

# Regénérer le client Prisma
npm run prisma:generate
```

### 2. Réinitialiser les données de test (optionnel)

Si vous voulez voir des sessions "journée" de test :

```bash
# Attention: supprime toutes les données existantes !
npm run prisma:seed
```

### 3. Redémarrer le serveur

```bash
# Backend
cd backend
npm run dev

# Frontend (dans un autre terminal)
cd frontend
npm run dev
```

## 🎯 Résultat

Après ces commandes, vous aurez :

1. **3 créneaux disponibles** :
   - Matin (09:00)
   - Après-midi (14:00)
   - Journée (09:00 - toute la journée)

2. **Données de test** (si seed exécuté) :
   - 4 produits : Raft intégral, Raft découverte, Zoïcu, Baptême
   - Sessions pour les 7 prochains jours
   - Sessions "journée" tous les 2 jours

3. **Interface** :
   ```
   ┌────────────────────────────┐
   │ Jeudi 21/06                │
   ├──────────┬─────────────────┤
   │  MATIN   │  APRÈS-MIDI     │
   ├──────────┴─────────────────┤
   │  JOURNÉE                   │
   └────────────────────────────┘
   ```

## 🔍 Créer une nouvelle session "journée"

Via l'API :

```bash
POST /api/sessions
{
  "date": "2024-06-21",
  "timeSlot": "journée",
  "startTime": "09:00",
  "productId": "product-3",
  "guideId": "xxx"
}
```

## ⚠️ Notes importantes

- Le champ `timeSlot` accepte maintenant : `"matin"`, `"après-midi"` ou `"journée"`
- Aucune migration SQL n'est nécessaire car `timeSlot` est déjà de type `String`
- Les sessions existantes ne sont pas affectées
- Le drag & drop fonctionne entre tous les créneaux

## 🚨 RÈGLE D'OR : Toujours créer une migration après modification du schema.prisma

**Workflow obligatoire :**

1. Modifier `schema.prisma`
2. Créer la migration : `npx prisma migrate dev --name description_changement`
3. Vérifier le fichier SQL généré
4. Régénérer le client : `npx prisma generate`
5. Redémarrer le serveur

**❌ Ne JAMAIS :**
- Modifier `schema.prisma` sans créer de migration
- Utiliser `db push` (sauf prototypage rapide)
- Modifier directement la base de données

**📖 Guide complet :** Voir [GUIDE_PRISMA.md](GUIDE_PRISMA.md)
