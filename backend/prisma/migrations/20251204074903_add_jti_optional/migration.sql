/*
  Warnings:

  - You are about to drop the column `deviceToken` on the `trusted_devices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[jti]` on the table `trusted_devices` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."trusted_devices_deviceToken_key";

-- AlterTable
ALTER TABLE "trusted_devices" DROP COLUMN "deviceToken",
ADD COLUMN     "jti" TEXT,
ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "trusted_devices_jti_key" ON "trusted_devices"("jti");
