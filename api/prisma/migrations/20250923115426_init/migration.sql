-- CreateEnum
CREATE TYPE "ImageStatus" AS ENUM ('ready', 'processing', 'failed');

-- CreateTable
CREATE TABLE "Image" (
    "id" TEXT NOT NULL,
    "hash" CHAR(64) NOT NULL,
    "cropSig" CHAR(40) NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "mime" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "status" "ImageStatus" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Image_hash_idx" ON "Image"("hash");

-- CreateIndex
CREATE INDEX "Image_status_idx" ON "Image"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Image_hash_cropSig_key" ON "Image"("hash", "cropSig");
