/*
  Warnings:

  - Made the column `userId` on table `account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `category` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "balance" REAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_account" ("balance", "color", "created_at", "id", "name", "tag", "userId") SELECT "balance", "color", "created_at", "id", "name", "tag", "userId" FROM "account";
DROP TABLE "account";
ALTER TABLE "new_account" RENAME TO "account";
CREATE INDEX "account_userId_idx" ON "account"("userId");
CREATE TABLE "new_category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "type" TEXT NOT NULL,
    "budgetLimit" REAL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_category" ("budgetLimit", "color", "icon", "id", "name", "type", "userId") SELECT "budgetLimit", "color", "icon", "id", "name", "type", "userId" FROM "category";
DROP TABLE "category";
ALTER TABLE "new_category" RENAME TO "category";
CREATE INDEX "category_userId_idx" ON "category"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
