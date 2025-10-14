# Guide des bonnes pratiques Prisma

## Comment éviter les erreurs de synchronisation base de données / schéma

### 1. Workflow correct pour modifier le schéma

#### Étape 1 : Modifier le schéma Prisma
Éditez `schema.prisma` avec vos modifications.

#### Étape 2 : Créer une migration
```bash
cd backend
npx prisma migrate dev --name description_du_changement
```

**Exemple :**
```bash
npx prisma migrate dev --name add_user_avatar
npx prisma migrate dev --name refactor_booking_system
```

#### Étape 3 : Vérifier la migration générée
- Regardez le fichier SQL généré dans `prisma/migrations/`
- Assurez-vous qu'il fait exactement ce que vous voulez
- Modifiez-le manuellement si nécessaire

#### Étape 4 : Redémarrer le serveur
```bash
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez-le
npm run dev
```

### 2. Ne JAMAIS faire

❌ **Ne modifiez JAMAIS le schéma sans créer de migration**
```
schema.prisma modifié → Migration OBLIGATOIRE
```

❌ **Ne pas utiliser `prisma db push` en production**
- `db push` est uniquement pour le prototypage rapide
- Il ne crée pas de migrations, donc pas d'historique
- Utilisez toujours `migrate dev` ou `migrate deploy`

❌ **Ne pas modifier directement la base de données**
- Toutes les modifications doivent passer par Prisma
- Si vous modifiez manuellement la BDD, elle sera désynchronisée

### 3. Commandes Prisma utiles

#### Vérifier l'état de la base de données
```bash
npx prisma migrate status
```

#### Voir le schéma actuel de la BDD
```bash
npx prisma db pull
```
Cela crée un schéma basé sur votre BDD actuelle (utile pour diagnostiquer)

#### Appliquer les migrations (production)
```bash
npx prisma migrate deploy
```

#### Réinitialiser complètement la BDD (développement uniquement)
```bash
npx prisma migrate reset
```
⚠️ Attention : Cela supprime TOUTES les données !

#### Générer le client Prisma
```bash
npx prisma generate
```
À faire après chaque modification du schéma

#### Ouvrir Prisma Studio (interface graphique)
```bash
npx prisma studio
```

### 4. Résoudre les problèmes courants

#### Erreur "column does not exist"
**Cause :** Le schéma Prisma ne correspond pas à la BDD

**Solution :**
1. Vérifier le statut : `npx prisma migrate status`
2. Créer la migration manquante : `npx prisma migrate dev`
3. Régénérer le client : `npx prisma generate`
4. Redémarrer le serveur

#### Erreur "EPERM" lors de la génération
**Cause :** Le serveur Node.js utilise encore les fichiers Prisma

**Solution :**
1. Arrêter complètement le serveur backend
2. Fermer Prisma Studio si ouvert
3. Relancer `npx prisma generate`

#### Migration en conflit
**Cause :** Plusieurs développeurs ont créé des migrations différentes

**Solution :**
1. Récupérer les dernières migrations du dépôt
2. Appliquer : `npx prisma migrate deploy`
3. Si conflit persistant : `npx prisma migrate resolve`

### 5. Workflow en équipe

#### Avant de commencer à coder
```bash
git pull
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
```

#### Avant de commit
```bash
# Si vous avez modifié schema.prisma
npx prisma migrate dev --name votre_description
git add prisma/migrations/
git commit -m "feat: votre description"
```

#### Après un git pull
```bash
cd backend
npx prisma migrate deploy  # Applique les nouvelles migrations
npx prisma generate         # Régénère le client
# Redémarrez le serveur
```

### 6. Checklist modification de schéma

Quand vous modifiez `schema.prisma` :

- [ ] Modifier `schema.prisma`
- [ ] Créer la migration : `npx prisma migrate dev --name ...`
- [ ] Vérifier le fichier SQL généré
- [ ] Tester localement
- [ ] Régénérer le client si nécessaire : `npx prisma generate`
- [ ] Redémarrer le serveur
- [ ] Tester que tout fonctionne
- [ ] Commit le schéma ET les migrations

### 7. Fichiers à versionner (Git)

✅ **À TOUJOURS commit :**
- `prisma/schema.prisma`
- `prisma/migrations/**/*.sql`
- `prisma/migrations/migration_lock.toml`
- `prisma/seed.js`

❌ **À JAMAIS commit :**
- `node_modules/`
- `.env` (contient DATABASE_URL)
- `node_modules/.prisma/`

### 8. Environnements

#### Développement local
```bash
npx prisma migrate dev        # Crée et applique les migrations
npx prisma migrate reset      # Reset complet (OK en dev)
```

#### Production
```bash
npx prisma migrate deploy     # Applique uniquement
# JAMAIS de reset en production !
```

### 9. Sauvegarde des données

Avant toute opération risquée :

```bash
# Backup PostgreSQL
pg_dump -U postgres -d booking_saas > backup_$(date +%Y%m%d_%H%M%S).sql

# Restauration
psql -U postgres -d booking_saas < backup_20251014_120000.sql
```

### 10. En cas d'urgence

Si tout est cassé et que rien ne fonctionne :

```bash
# 1. Sauvegarder les données importantes
pg_dump -U postgres -d booking_saas > backup_urgence.sql

# 2. Reset complet
cd backend
npx prisma migrate reset --force

# 3. Relancer le seed
node prisma/seed.js

# 4. Régénérer le client
npx prisma generate

# 5. Redémarrer le serveur
npm run dev
```

## Ressources

- Documentation Prisma Migrate : https://www.prisma.io/docs/concepts/components/prisma-migrate
- Prisma Schema Reference : https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- Troubleshooting : https://www.prisma.io/docs/guides/migrate/troubleshooting
