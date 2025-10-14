-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "participantsFormCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productDetailsSent" BOOLEAN NOT NULL DEFAULT false;
