-- AlterEnum
ALTER TYPE "EntryType" ADD VALUE 'LINK';

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN "externalUrl" TEXT;
