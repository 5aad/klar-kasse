import { asc, eq, isNull } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import { categories, syncOutbox } from "@/db/schema";

export type PostCategoryInput = {
  color?: string;
  icon?: string;
  isDefault?: boolean;
  name: string;
};

export type EditCategoryInput = Partial<PostCategoryInput> & {
  id: string;
};

function createLocalId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
}

export async function postCategory(input: PostCategoryInput) {
  initializeDatabase();

  const now = new Date().toISOString();
  const categoryId = createLocalId("category");

  db.transaction((tx) => {
    tx.insert(categories)
      .values({
        id: categoryId,
        name: input.name.trim(),
        icon: input.icon,
        color: input.color,
        isDefault: input.isDefault ?? false,
        syncStatus: "pending",
        syncAction: "create",
        createdAt: now,
        updatedAt: now,
      })
      .run();

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "category",
        entityId: categoryId,
        operation: "create",
        payloadJson: JSON.stringify(input),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return getCategory(categoryId);
}

export async function editCategory(input: EditCategoryInput) {
  initializeDatabase();

  const now = new Date().toISOString();
  const existingCategory = await getCategory(input.id);

  if (!existingCategory) return null;

  const nextValues = {
    ...(input.name !== undefined ? { name: input.name.trim() } : undefined),
    ...(input.icon !== undefined ? { icon: input.icon } : undefined),
    ...(input.color !== undefined ? { color: input.color } : undefined),
    ...(input.isDefault !== undefined
      ? { isDefault: input.isDefault }
      : undefined),
    syncStatus: "pending",
    syncAction: existingCategory.syncAction === "create" ? "create" : "update",
    updatedAt: now,
  };

  db.transaction((tx) => {
    tx.update(categories)
      .set(nextValues)
      .where(eq(categories.id, input.id))
      .run();

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "category",
        entityId: input.id,
        operation: "update",
        payloadJson: JSON.stringify(input),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return getCategory(input.id);
}

export async function getCategory(id: string) {
  initializeDatabase();

  const category = db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .get();

  if (!category || category.deletedAt) return null;

  return category;
}

export async function getCategories() {
  initializeDatabase();

  return db
    .select()
    .from(categories)
    .where(isNull(categories.deletedAt))
    .orderBy(asc(categories.name))
    .all();
}
