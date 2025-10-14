/*
  Warnings:

  - You are about to drop the column `magicRotationProducts` on the `sessions` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `sessions` table. All the data in the column will be lost.
  - Added the required column `productId` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_productId_fkey";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "productId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "magicRotationProducts",
DROP COLUMN "productId";

-- CreateTable
CREATE TABLE "session_products" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_products_sessionId_productId_key" ON "session_products"("sessionId", "productId");

-- AddForeignKey
ALTER TABLE "session_products" ADD CONSTRAINT "session_products_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_products" ADD CONSTRAINT "session_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
