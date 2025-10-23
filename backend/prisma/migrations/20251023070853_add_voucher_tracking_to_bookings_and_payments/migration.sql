-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "voucherCode" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "voucherCode" TEXT;
