/*
  Warnings:

  - Added the required column `activityTypeId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "activityTypeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
