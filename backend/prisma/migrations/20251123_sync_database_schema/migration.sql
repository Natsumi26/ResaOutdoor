-- Migration: Sync database schema with actual state
-- Date: 2025-11-23
-- This migration adds fields that were added to the schema but never migrated

-- Add confirmationRedirectUrl to settings table
ALTER TABLE "settings" ADD COLUMN "confirmationRedirectUrl" TEXT;

-- Add practiceLevel and comment to participants table
ALTER TABLE "participants" ADD COLUMN "practiceLevel" TEXT;
ALTER TABLE "participants" ADD COLUMN "comment" TEXT;

-- CreateTable: pending_bookings
CREATE TABLE "pending_bookings" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "bookingData" JSONB NOT NULL,
    "participants" JSONB,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "isDeposit" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_bookings_pkey" PRIMARY KEY ("id")
);
