# 📝 Aide-mémoire Prisma - Actions courantes

## 🚀 Démarrage rapide

### Premier lancement du projet
```bash
cd backend
npm install
npm run setup              # Install + generate + migrate
npm run prisma:seed        # Créer les données de test
npm run dev                # Démarrer le serveur
```

### Après un git pull
```bash
cd backend
npm install                      # Au cas où de nouvelles dépendances
npm run prisma:migrate:deploy    # Appliquer les nouvelles migrations
npm run dev                      # Redémarrer le serveur
```

## 🔧 Modifier le schéma Prisma

### Workflow complet (À TOUJOURS SUIVRE)
```bash
# 1. Modifier schema.prisma
# 2. Créer la migration
npm run prisma:migrate

# 3. Donner un nom descriptif à la migration
# Exemple: "add_user_avatar" ou "refactor_booking_system"

# 4. Vérifier le fichier SQL généré
# Regarder dans prisma/migrations/[timestamp]_[nom]/migration.sql

# 5. Redémarrer le serveur
npm run dev
```

## 📊 Commandes utiles

### Vérifier l'état
```bash
npm run prisma:migrate:status    # Voir l'état des migrations
```

### Voir les données
```bash
npm run prisma:studio            # Interface graphique sur http://localhost:5555
```

### Sauvegarder la base
```bash
npm run db:backup                # Crée un backup dans backend/backups/
```

### Réinitialiser (DANGER : supprime tout)
```bash
npm run prisma:migrate:reset     # Reset complet + seed
```

### Voir la structure actuelle de la BDD
```bash
npm run prisma:pull              # Récupère le schéma depuis la BDD
```

## ⚠️ En cas de problème

### Erreur "column does not exist"
```bash
# 1. Vérifier l'état
npm run prisma:migrate:status

# 2. Si des migrations ne sont pas appliquées
npm run prisma:migrate:deploy

# 3. Régénérer le client
npm run prisma:generate

# 4. Redémarrer le serveur
npm run dev
```

### Erreur "EPERM" lors de la génération
```bash
# 1. Arrêter TOUS les serveurs Node.js
# 2. Fermer Prisma Studio
# 3. Relancer
npm run prisma:generate
npm run dev
```

### Base de données complètement cassée
```bash
# 1. Faire un backup (si possible)
npm run db:backup

# 2. Reset complet
npm run prisma:migrate:reset

# 3. Relancer le seed
npm run prisma:seed

# 4. Redémarrer
npm run dev
```

## 🔑 Identifiants par défaut

Après un reset, l'utilisateur admin créé par le seed :
- **Login:** canyonlife
- **Mot de passe:** canyonlife
- **Email:** admin@canyonlife.com
- **Rôle:** admin

## 📚 Documentation complète

Voir [GUIDE_PRISMA.md](GUIDE_PRISMA.md) pour le guide complet.
