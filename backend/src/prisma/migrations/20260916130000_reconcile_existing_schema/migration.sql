-- AlterTable
ALTER TABLE "category" ADD COLUMN "budgetLimit" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "balance" REAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_account" ("balance", "color", "created_at", "id", "name") SELECT "balance", "color", "created_at", "id", "name" FROM "account";
DROP TABLE "account";
ALTER TABLE "new_account" RENAME TO "account";
CREATE TABLE "new_transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "create_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" DATETIME,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "notes" TEXT,
    "destinationAccountId" TEXT,
    FOREIGN KEY ("categoryId") REFERENCES "category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("accountId") REFERENCES "account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("destinationAccountId") REFERENCES "account" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transaction" ("accountId", "amount", "categoryId", "create_at", "description", "edited_at", "id", "notes", "type") SELECT "accountId", "amount", "categoryId", "create_at", "description", "edited_at", "id", "notes", "type" FROM "transaction";
DROP TABLE "transaction";
ALTER TABLE "new_transaction" RENAME TO "transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
