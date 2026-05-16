import { eq } from "drizzle-orm";
import { Platform } from "react-native";

import { db, initializeDatabase } from "@/db";
import { appActivityEvents, deviceInfo } from "@/db/schema";

const LOCAL_DEVICE_INFO_ID = "local_device";
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const APP_VERSION = process.env.EXPO_PUBLIC_APP_VERSION ?? "unknown";

function createLocalId(prefix: string) {
  const randomId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomId}`;
}

function getSupabaseRestUrl(path: string) {
  return `${SUPABASE_URL?.replace(/\/$/, "")}/rest/v1/${path}`;
}

function getSupabaseHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY ?? "",
    Authorization: `Bearer ${SUPABASE_ANON_KEY ?? ""}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };
}

function isActivitySyncConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getDeviceName() {
  const constants = Platform.constants as {
    Brand?: string;
    Manufacturer?: string;
    Model?: string;
    model?: string;
    systemName?: string;
  };
  const manufacturer = constants.Manufacturer ?? constants.Brand;
  const model = constants.Model ?? constants.model;

  return [manufacturer, model].filter(Boolean).join(" ") || Platform.OS;
}

function logActivitySync(message: string, data?: unknown) {
  if (__DEV__) {
    console.log(`[app-activity] ${message}`, data ?? "");
  }
}

function ensureDeviceInfo() {
  initializeDatabase();
  const deviceName = getDeviceName();

  const existingDeviceInfo = db
    .select()
    .from(deviceInfo)
    .where(eq(deviceInfo.id, LOCAL_DEVICE_INFO_ID))
    .get();

  if (existingDeviceInfo) {
    if (existingDeviceInfo.deviceName !== deviceName) {
      const now = new Date().toISOString();

      db.update(deviceInfo)
        .set({
          deviceName,
          platform: Platform.OS,
          appVersion: APP_VERSION,
          updatedAt: now,
        })
        .where(eq(deviceInfo.id, LOCAL_DEVICE_INFO_ID))
        .run();

      return db
        .select()
        .from(deviceInfo)
        .where(eq(deviceInfo.id, LOCAL_DEVICE_INFO_ID))
        .get();
    }

    return existingDeviceInfo;
  }

  const now = new Date().toISOString();
  const installationId = createLocalId("installation");
  const deviceId = createLocalId("device");

  db.insert(deviceInfo)
    .values({
      id: LOCAL_DEVICE_INFO_ID,
      deviceId,
      deviceName,
      installationId,
      platform: Platform.OS,
      appVersion: APP_VERSION,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return db
    .select()
    .from(deviceInfo)
    .where(eq(deviceInfo.id, LOCAL_DEVICE_INFO_ID))
    .get();
}

export async function recordAppOpened() {
  const info = ensureDeviceInfo();
  if (!info) return null;

  const now = new Date().toISOString();
  const eventId = createLocalId("app_activity");

  db.insert(appActivityEvents)
    .values({
      id: eventId,
      installationId: info.installationId,
      deviceId: info.deviceId,
      deviceName: info.deviceName,
      platform: Platform.OS,
      appVersion: APP_VERSION,
      openedAt: now,
      syncStatus: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logActivitySync("recorded app open", { eventId });

  return eventId;
}

export async function syncPendingAppActivity() {
  initializeDatabase();

  if (!isActivitySyncConfigured()) {
    logActivitySync("missing Supabase env vars; event stays pending");
    return;
  }

  const pendingEvents = db
    .select()
    .from(appActivityEvents)
    .where(eq(appActivityEvents.syncStatus, "pending"))
    .all()
    .slice(0, 25);

  if (!pendingEvents.length) {
    logActivitySync("no pending events");
    return;
  }

  const payload = pendingEvents.map((event) => ({
    installation_id: event.installationId,
    device_id: event.deviceId,
    device_name: event.deviceName,
    platform: event.platform,
    app_version: event.appVersion,
    opened_at: event.openedAt,
  }));
  const now = new Date().toISOString();

  try {
    const response = await fetch(getSupabaseRestUrl("app_activity"), {
      method: "POST",
      headers: getSupabaseHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");

      throw new Error(
        `Supabase activity sync failed: ${response.status} ${responseText}`,
      );
    }

    db.transaction((tx) => {
      for (const event of pendingEvents) {
        tx.update(appActivityEvents)
          .set({
            syncStatus: "synced",
            syncedAt: now,
            syncError: null,
            updatedAt: now,
          })
          .where(eq(appActivityEvents.id, event.id))
          .run();
      }

      tx.update(deviceInfo)
        .set({
          lastSyncedAt: now,
          updatedAt: now,
        })
        .where(eq(deviceInfo.id, LOCAL_DEVICE_INFO_ID))
        .run();
    });

    logActivitySync("synced events", { count: pendingEvents.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logActivitySync("sync failed", message);

    db.transaction((tx) => {
      for (const event of pendingEvents) {
        tx.update(appActivityEvents)
          .set({
            syncError: message,
            updatedAt: now,
          })
          .where(eq(appActivityEvents.id, event.id))
          .run();
      }
    });
  }
}
