-- AlterTable: Add shoe rental fields to sessions
ALTER TABLE "sessions" ADD COLUMN "shoeRentalAvailable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "sessions" ADD COLUMN "shoeRentalPrice" DOUBLE PRECISION;

-- CreateTable: Participants
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "wetsuitSize" TEXT,
    "shoeRental" BOOLEAN NOT NULL DEFAULT false,
    "shoeSize" INTEGER,
    "bookingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
