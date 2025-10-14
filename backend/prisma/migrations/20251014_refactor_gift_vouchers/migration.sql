-- Refactoring de la table gift_vouchers pour supporter les codes promos

-- Créer la table promo_code_usages pour l'historique
CREATE TABLE "promo_code_usages" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "usedBy" TEXT,
    "bookingId" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_code_usages_pkey" PRIMARY KEY ("id")
);

-- Migrer les données existantes vers la nouvelle table
INSERT INTO "promo_code_usages" ("id", "voucherId", "usedBy", "usedAt")
SELECT
    gen_random_uuid()::text,
    "id",
    "usedBy",
    COALESCE("usedAt", CURRENT_TIMESTAMP)
FROM "gift_vouchers"
WHERE "isUsed" = true AND "usedBy" IS NOT NULL;

-- Ajouter les nouvelles colonnes
ALTER TABLE "gift_vouchers" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'voucher';
ALTER TABLE "gift_vouchers" ADD COLUMN "maxUsages" INTEGER;
ALTER TABLE "gift_vouchers" ADD COLUMN "usageCount" INTEGER NOT NULL DEFAULT 0;

-- Mettre à jour usageCount pour les bons déjà utilisés
UPDATE "gift_vouchers" SET "usageCount" = 1 WHERE "isUsed" = true;

-- Supprimer les anciennes colonnes
ALTER TABLE "gift_vouchers" DROP COLUMN "isUsed";
ALTER TABLE "gift_vouchers" DROP COLUMN "usedAt";
ALTER TABLE "gift_vouchers" DROP COLUMN "usedBy";

-- Ajouter la contrainte de clé étrangère
ALTER TABLE "promo_code_usages" ADD CONSTRAINT "promo_code_usages_voucherId_fkey"
    FOREIGN KEY ("voucherId") REFERENCES "gift_vouchers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
