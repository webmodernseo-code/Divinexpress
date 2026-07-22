-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "cloudinaryPublicId" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;
