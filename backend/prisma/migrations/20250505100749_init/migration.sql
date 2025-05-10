-- CreateEnum
CREATE TYPE "HelpStatus" AS ENUM ('PENDING', 'RESOLVED', 'UNRESOLVED');

-- CreateTable
CREATE TABLE "HelpRequest" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "status" "HelpStatus" NOT NULL DEFAULT 'PENDING',
    "answer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HelpRequest_pkey" PRIMARY KEY ("id")
);
