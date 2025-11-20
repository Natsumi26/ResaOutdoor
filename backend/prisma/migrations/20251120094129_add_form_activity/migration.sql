-- CreateTable
CREATE TABLE "activity_form_configs" (
    "id" TEXT NOT NULL,
    "activityTypeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fields" JSONB NOT NULL,
    "wetsuitBrand" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_form_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_form_configs_activityTypeId_userId_key" ON "activity_form_configs"("activityTypeId", "userId");

-- AddForeignKey
ALTER TABLE "activity_form_configs" ADD CONSTRAINT "activity_form_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
