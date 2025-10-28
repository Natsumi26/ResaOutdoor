-- Migration manuelle pour la hiérarchie de teams
-- À exécuter AVANT npx prisma db push

-- 1. Ajouter les nouvelles colonnes à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS "teamLeaderId" TEXT;

-- 2. Migrer les rôles existants
-- admin -> leader
UPDATE users SET role = 'leader' WHERE role = 'admin';

-- guide -> employee
UPDATE users SET role = 'employee' WHERE role = 'guide';

-- 3. Ajouter userId aux tables gift_vouchers et resellers
-- On va assigner les bons cadeaux et revendeurs au premier utilisateur leader trouvé
-- (vous pourrez les réassigner manuellement plus tard si besoin)

DO $$
DECLARE
    first_leader_id TEXT;
BEGIN
    -- Récupérer le premier leader
    SELECT id INTO first_leader_id FROM users WHERE role = 'leader' LIMIT 1;

    -- Si aucun leader n'existe, utiliser le premier utilisateur
    IF first_leader_id IS NULL THEN
        SELECT id INTO first_leader_id FROM users LIMIT 1;
    END IF;

    -- Ajouter la colonne userId aux gift_vouchers si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'gift_vouchers' AND column_name = 'userId'
    ) THEN
        ALTER TABLE gift_vouchers ADD COLUMN "userId" TEXT;
        -- Assigner tous les bons cadeaux existants au premier leader
        UPDATE gift_vouchers SET "userId" = first_leader_id WHERE "userId" IS NULL;
        -- Rendre la colonne NOT NULL
        ALTER TABLE gift_vouchers ALTER COLUMN "userId" SET NOT NULL;
    END IF;

    -- Ajouter la colonne userId aux resellers si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'resellers' AND column_name = 'userId'
    ) THEN
        ALTER TABLE resellers ADD COLUMN "userId" TEXT;
        -- Assigner tous les revendeurs existants au premier leader
        UPDATE resellers SET "userId" = first_leader_id WHERE "userId" IS NULL;
        -- Rendre la colonne NOT NULL
        ALTER TABLE resellers ALTER COLUMN "userId" SET NOT NULL;
    END IF;
END $$;

-- 4. Créer les contraintes de clé étrangère
-- teamLeaderId -> users
ALTER TABLE users
    ADD CONSTRAINT "users_teamLeaderId_fkey"
    FOREIGN KEY ("teamLeaderId")
    REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- userId dans gift_vouchers -> users
ALTER TABLE gift_vouchers
    ADD CONSTRAINT "gift_vouchers_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- userId dans resellers -> users
ALTER TABLE resellers
    ADD CONSTRAINT "resellers_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE;
