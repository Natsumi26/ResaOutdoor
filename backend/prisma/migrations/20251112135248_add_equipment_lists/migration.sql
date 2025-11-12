-- AlterTable
ALTER TABLE "products" ADD COLUMN     "equipmentListId" TEXT;

-- CreateTable
CREATE TABLE "equipment_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_lists_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_equipmentListId_fkey" FOREIGN KEY ("equipmentListId") REFERENCES "equipment_lists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment_lists" ADD CONSTRAINT "equipment_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
