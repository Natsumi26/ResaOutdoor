# ✅ Checklist de déploiement et bonnes pratiques

## 🔒 Sécurité - Avant de déployer en production

### Fichiers sensibles
- [ ] `.env` est dans `.gitignore` et n'est PAS commité
- [ ] Tous les mots de passe sont différents de ceux de dev
- [ ] `JWT_SECRET` est une chaîne aléatoire longue et sécurisée
- [ ] Les identifiants PostgreSQL sont sécurisés
- [ ] Les clés Stripe sont les clés de production (pas test)

### Configuration production
- [ ] `NODE_ENV=production` dans le `.env`
- [ ] Les CORS sont configurés pour accepter uniquement votre domaine
- [ ] Rate limiting activé sur les routes sensibles
- [ ] HTTPS activé (certificat SSL)
- [ ] Logs de production configurés

### Base de données
- [ ] Backup automatique configuré
- [ ] Utilisateur PostgreSQL avec privilèges minimaux
- [ ] Base de données accessible uniquement depuis le serveur backend
- [ ] Pas de `prisma migrate reset` possible en production

## 📦 Checklist pré-commit

Avant chaque commit, vérifier :

- [ ] Le code fonctionne localement
- [ ] Pas de console.log inutiles
- [ ] Pas de TODO critiques
- [ ] `.env` n'est pas dans les fichiers modifiés
- [ ] Les migrations Prisma sont générées et testées
- [ ] `prisma/migrations/` est bien inclus dans le commit

## 🚀 Procédure de déploiement

### 1. Sur le serveur de production

```bash
# 1. Récupérer les derniers changements
git pull origin main

# 2. Installer les dépendances
cd backend
npm install

# 3. Appliquer les migrations (JAMAIS de reset !)
npm run prisma:migrate:deploy

# 4. Générer le client Prisma
npm run prisma:generate

# 5. Redémarrer le serveur
pm2 restart backend
# ou
systemctl restart backend
```

### 2. Vérifications post-déploiement

- [ ] Backend répond correctement (health check)
- [ ] Frontend se connecte au backend
- [ ] Connexion fonctionne
- [ ] Les nouvelles fonctionnalités marchent
- [ ] Vérifier les logs pour erreurs

## 🔄 Workflow Git recommandé

### Branches
```
main (production)
  └── develop (développement)
       └── feature/nom-feature (fonctionnalités)
```

### Avant de push
```bash
# Vérifier l'état
git status

# S'assurer que les migrations sont incluses
git add prisma/migrations/
git add prisma/schema.prisma

# Commit avec message descriptif
git commit -m "feat: ajout du système de codes promos réutilisables"

# Push
git push origin feature/nom-feature
```

## 🛡️ Sauvegardes

### Fréquence recommandée
- **Production** : Backup automatique quotidien
- **Avant migration importante** : Backup manuel

### Script de backup automatique (cron)
```bash
# Backup tous les jours à 3h du matin
0 3 * * * cd /path/to/backend && npm run db:backup
```

### Tester la restauration
```bash
# Tester régulièrement que les backups fonctionnent
psql -U postgres -d booking_saas_test < backup.sql
```

## 🚨 En cas de problème en production

### 1. Rollback Git
```bash
# Revenir au commit précédent
git log                      # Trouver le hash du dernier commit stable
git reset --hard [hash]
git push --force origin main # UNIQUEMENT SI VRAIMENT NÉCESSAIRE
```

### 2. Rollback base de données
```bash
# Restaurer depuis backup
psql -U postgres -d booking_saas < backup_latest.sql

# Vérifier l'état des migrations
npm run prisma:migrate:status
```

### 3. Vérifier les logs
```bash
# Logs PM2
pm2 logs backend

# Logs PostgreSQL
tail -f /var/log/postgresql/postgresql-*.log

# Logs système
journalctl -u backend -f
```

## 📊 Monitoring recommandé

### Métriques à surveiller
- [ ] Temps de réponse API
- [ ] Erreurs 500 (backend)
- [ ] Utilisation CPU/RAM
- [ ] Espace disque disponible
- [ ] Connexions PostgreSQL actives

### Alertes à configurer
- [ ] API down (pas de réponse)
- [ ] Erreurs répétées
- [ ] Espace disque < 10%
- [ ] RAM > 90%

## 📝 Variables d'environnement requises

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://votre-domaine.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Email (si configuré)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=...
```

### Frontend (.env)
```env
VITE_API_URL=https://api.votre-domaine.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## 🧪 Tests avant déploiement

- [ ] Tester la création de réservations
- [ ] Tester les paiements (mode test Stripe)
- [ ] Tester l'authentification
- [ ] Tester les bons cadeaux/codes promos
- [ ] Vérifier le responsive mobile
- [ ] Tester avec des données volumineuses

## 📞 Contacts d'urgence

En cas de problème critique :
1. Vérifier les logs
2. Contacter l'hébergeur si infrastructure
3. Rollback si nécessaire
4. Investiguer en environnement de test

## 🎯 Bonnes pratiques au quotidien

### Développement
- ✅ Toujours créer une migration après modification du schéma
- ✅ Tester localement avant de commit
- ✅ Faire des commits atomiques (une fonctionnalité = un commit)
- ✅ Utiliser des messages de commit descriptifs
- ✅ Ne jamais commit de données sensibles

### Base de données
- ✅ Toujours faire un backup avant une migration importante
- ✅ Tester les migrations sur une copie de la BDD de prod
- ✅ Vérifier l'état des migrations : `npm run prisma:migrate:status`
- ✅ Ne jamais modifier la BDD directement en production
- ✅ Documenter les changements de schéma importants

### Sécurité
- ✅ Mettre à jour régulièrement les dépendances
- ✅ Scanner les vulnérabilités : `npm audit`
- ✅ Ne jamais logger de données sensibles
- ✅ Valider toutes les entrées utilisateur
- ✅ Utiliser des requêtes paramétrées (Prisma le fait)
