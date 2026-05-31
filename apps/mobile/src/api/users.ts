import { eq } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import { syncOutbox, users, type User } from "@/db/schema";
import type { ThemePreference } from "@/stores/theme-store";
import { avatarImageUrls, downloadAvatarImage } from "@/utils/avatar-images";

const LOCAL_USER_ID = "local_user";
const DEFAULT_USER_NAME = "set your name";
const DEFAULT_CURRENCY = "€";

export type SaveUserPreferencesInput = {
  appTheme?: ThemePreference;
  currency?: string;
  name?: string;
  profileImageUri?: string | null;
};

function createLocalId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
}

function normalizeCurrency(currency?: string) {
  const value = currency?.trim().replace(/\s+/g, " ").slice(0, 6);

  return value || DEFAULT_CURRENCY;
}

function ensureLocalUser() {
  const existingUser = db
    .select()
    .from(users)
    .where(eq(users.id, LOCAL_USER_ID))
    .get();

  if (existingUser) return existingUser;

  const now = new Date().toISOString();

  db.insert(users)
    .values({
      id: LOCAL_USER_ID,
      name: DEFAULT_USER_NAME,
      appTheme: "system",
      currency: DEFAULT_CURRENCY,
      syncStatus: "pending",
      syncAction: "create",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return db.select().from(users).where(eq(users.id, LOCAL_USER_ID)).get();
}

async function ensureDefaultProfileImage(user: User | undefined) {
  if (!user || user.profileImageUri) return user;

  try {
    const now = new Date().toISOString();
    const profileImageUri = await downloadAvatarImage(avatarImageUrls[0]);

    db.update(users)
      .set({
        profileImageUri,
        syncStatus: "pending",
        syncAction: user.syncAction === "create" ? "create" : "update",
        updatedAt: now,
      })
      .where(eq(users.id, LOCAL_USER_ID))
      .run();

    return db.select().from(users).where(eq(users.id, LOCAL_USER_ID)).get();
  } catch (error) {
    console.warn("Default avatar download failed:", error);

    return user;
  }
}

export async function getUserPreferences() {
  return ensureDefaultProfileImage(await getLocalUserPreferences());
}

export async function getLocalUserPreferences() {
  initializeDatabase();

  return ensureLocalUser();
}

export async function saveUserPreferences(input: SaveUserPreferencesInput) {
  initializeDatabase();

  const existingUser = ensureLocalUser();
  const now = new Date().toISOString();
  const nextValues: Partial<User> = {
    ...(input.name !== undefined ? { name: input.name.trim() } : undefined),
    ...(input.appTheme !== undefined
      ? { appTheme: input.appTheme }
      : undefined),
    ...(input.currency !== undefined
      ? { currency: normalizeCurrency(input.currency) }
      : undefined),
    ...(input.profileImageUri !== undefined
      ? { profileImageUri: input.profileImageUri }
      : undefined),
    syncStatus: "pending",
    syncAction: existingUser?.syncAction === "create" ? "create" : "update",
    updatedAt: now,
  };

  db.transaction((tx) => {
    tx.update(users).set(nextValues).where(eq(users.id, LOCAL_USER_ID)).run();

    tx.insert(syncOutbox)
      .values({
        id: createLocalId("sync"),
        entityType: "user",
        entityId: LOCAL_USER_ID,
        operation: "update",
        payloadJson: JSON.stringify(input),
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .run();
  });

  return getUserPreferences();
}
