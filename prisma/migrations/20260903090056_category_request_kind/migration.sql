-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "display" TEXT,
    "requestKind" TEXT NOT NULL DEFAULT 'purchase',
    "parentId" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("createdAt", "display", "id", "kind", "parentId", "slug", "sort", "title", "updatedAt", "visible") SELECT "createdAt", "display", "id", "kind", "parentId", "slug", "sort", "title", "updatedAt", "visible" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE INDEX "Category_kind_visible_sort_idx" ON "Category"("kind", "visible", "sort");
CREATE UNIQUE INDEX "Category_kind_slug_key" ON "Category"("kind", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
