/*
  Warnings:

  - You are about to drop the column `language` on the `settings` table. All the data in the column will be lost.
  - Added the required column `userId` to the `gift_vouchers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `resellers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."email_templates_type_key";

-- AlterTable
ALTER TABLE "email_templates" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "gift_vouchers" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "resellers" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "settings" DROP COLUMN "language",
ADD COLUMN     "clientAccentColor" TEXT,
ADD COLUMN     "clientButtonColor" TEXT,
ADD COLUMN     "slogan" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "confidentialityPolicy" TEXT,
ADD COLUMN     "depositAmount" DOUBLE PRECISION,
ADD COLUMN     "depositType" TEXT,
ADD COLUMN     "paymentMode" TEXT DEFAULT 'onsite_only',
ADD COLUMN     "practiceActivities" TEXT[],
ADD COLUMN     "teamLeaderId" TEXT,
ADD COLUMN     "teamName" TEXT,
ALTER COLUMN "role" SET DEFAULT 'employee';

-- CreateTable
CREATE TABLE "newsletter" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "acceptedTerms" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "firstName" TEXT,
    "lastName" TEXT,
    "source" TEXT,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "userId" TEXT,

    CONSTRAINT "newsletter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_email_key" ON "newsletter"("email");

-- CreateIndex
CREATE INDEX "email_templates_type_idx" ON "email_templates"("type");

-- CreateIndex
CREATE INDEX "email_templates_userId_type_idx" ON "email_templates"("userId", "type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teamLeaderId_fkey" FOREIGN KEY ("teamLeaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resellers" ADD CONSTRAINT "resellers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_vouchers" ADD CONSTRAINT "gift_vouchers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "newsletter" ADD CONSTRAINT "newsletter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
