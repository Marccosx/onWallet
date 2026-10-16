-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "installmentGroupId" TEXT,
    "balanceApplied" BOOLEAN NOT NULL DEFAULT true,
    "paidAt" DATETIME,
    CONSTRAINT "transaction_destinationAccountId_fkey" FOREIGN KEY ("destinationAccountId") REFERENCES "account" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_transaction" ("accountId", "amount", "categoryId", "create_at", "description", "destinationAccountId", "edited_at", "id", "installmentGroupId", "notes", "type") SELECT "accountId", "amount", "categoryId", "create_at", "description", "destinationAccountId", "edited_at", "id", "installmentGroupId", "notes", "type" FROM "transaction";
DROP TABLE "transaction";
ALTER TABLE "new_transaction" RENAME TO "transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
