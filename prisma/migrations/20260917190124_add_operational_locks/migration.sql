-- CreateTable
CREATE TABLE "OperationalLock" (
    "id" TEXT NOT NULL,
    "lockKey" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "ownerClientId" TEXT NOT NULL,
    "acquiredAt" TIMESTAMP(3) NOT NULL,
    "lastHeartbeatAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationalLock_lockKey_key" ON "OperationalLock"("lockKey");

-- CreateIndex
CREATE INDEX "OperationalLock_ownerUserId_idx" ON "OperationalLock"("ownerUserId");

-- CreateIndex
CREATE INDEX "OperationalLock_area_idx" ON "OperationalLock"("area");

-- CreateIndex
CREATE INDEX "OperationalLock_lastHeartbeatAt_idx" ON "OperationalLock"("lastHeartbeatAt");

-- AddForeignKey
ALTER TABLE "OperationalLock" ADD CONSTRAINT "OperationalLock_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
