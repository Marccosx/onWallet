-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "accountType" TEXT NOT NULL DEFAULT 'AVAILABLE_CASH',
    "balance" REAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "goalAmount" REAL,
    "goalMode" TEXT,
    "goalStartMonth" TEXT,
    "goalTargetMonth" TEXT,
    "goalMonthlyAmount" REAL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_account" ("balance", "color", "created_at", "goalAmount", "goalMode", "goalMonthlyAmount", "goalStartMonth", "goalTargetMonth", "id", "name", "tag", "userId") SELECT "balance", "color", "created_at", "goalAmount", "goalMode", "goalMonthlyAmount", "goalStartMonth", "goalTargetMonth", "id", "name", "tag", "userId" FROM "account";
DROP TABLE "account";
ALTER TABLE "new_account" RENAME TO "account";
CREATE INDEX "account_userId_idx" ON "account"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
