-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "color" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_account" ("balance", "color", "id", "name", "type") SELECT "balance", "color", "id", "name", "type" FROM "account";
DROP TABLE "account";
ALTER TABLE "new_account" RENAME TO "account";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
