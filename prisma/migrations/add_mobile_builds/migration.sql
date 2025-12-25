-- CreateTable
CREATE TABLE "builds" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "buildType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "appVersion" TEXT NOT NULL,
    "versionCode" INTEGER NOT NULL,
    "appName" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "fileSize" INTEGER,
    "fileName" TEXT,
    "error" TEXT,
    "errorDetails" TEXT,
    "buildDuration" INTEGER,
    "completedAt" TIMESTAMP(3),
    "appId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "builds_appId_idx" ON "builds"("appId");

-- CreateIndex
CREATE INDEX "builds_status_idx" ON "builds"("status");

-- CreateIndex
CREATE INDEX "builds_platform_idx" ON "builds"("platform");

-- AddForeignKey
ALTER TABLE "builds" ADD CONSTRAINT "builds_appId_fkey" FOREIGN KEY ("appId") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
