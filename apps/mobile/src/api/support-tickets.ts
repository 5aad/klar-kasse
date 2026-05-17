import { eq } from "drizzle-orm";

import { db, initializeDatabase } from "@/db";
import { supportTickets } from "@/db/schema";
import { ensureDeviceInfo } from "@/api/app-activity";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export type SubmitSupportTicketInput = {
  email?: string;
  message: string;
  name?: string;
};

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

function isSupportSyncConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function logSupportSync(message: string, data?: unknown) {
  if (__DEV__) {
    console.log(`[support-tickets] ${message}`, data ?? "");
  }
}

function normalizeOptionalText(value?: string) {
  const trimmed = value?.trim();

  return trimmed || null;
}

export async function submitSupportTicket(input: SubmitSupportTicketInput) {
  initializeDatabase();

  const message = input.message.trim();
  if (!message) {
    throw new Error("Support message is required.");
  }

  const info = ensureDeviceInfo();
  if (!info) {
    throw new Error("Device info is unavailable.");
  }

  const now = new Date().toISOString();
  const ticketId = createLocalId("support_ticket");

  db.insert(supportTickets)
    .values({
      id: ticketId,
      installationId: info.installationId,
      deviceId: info.deviceId,
      deviceName: info.deviceName,
      platform: info.platform,
      appVersion: info.appVersion,
      name: normalizeOptionalText(input.name),
      email: normalizeOptionalText(input.email),
      message,
      status: "open",
      syncStatus: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .run();

  logSupportSync("saved local ticket", { ticketId });
  await syncPendingSupportTickets();

  return ticketId;
}

export async function syncPendingSupportTickets() {
  initializeDatabase();

  if (!isSupportSyncConfigured()) {
    logSupportSync("missing Supabase env vars; ticket stays pending");
    return;
  }

  const pendingTickets = db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.syncStatus, "pending"))
    .all()
    .slice(0, 10);

  if (!pendingTickets.length) {
    logSupportSync("no pending tickets");
    return;
  }

  const payload = pendingTickets.map((ticket) => ({
    installation_id: ticket.installationId,
    device_id: ticket.deviceId,
    device_name: ticket.deviceName,
    platform: ticket.platform,
    app_version: ticket.appVersion,
    name: ticket.name,
    email: ticket.email,
    message: ticket.message,
    status: ticket.status,
    created_at: ticket.createdAt,
  }));
  const now = new Date().toISOString();

  try {
    const response = await fetch(getSupabaseRestUrl("support_tickets"), {
      method: "POST",
      headers: getSupabaseHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");

      throw new Error(
        `Supabase support sync failed: ${response.status} ${responseText}`,
      );
    }

    db.transaction((tx) => {
      for (const ticket of pendingTickets) {
        tx.update(supportTickets)
          .set({
            syncStatus: "synced",
            syncedAt: now,
            syncError: null,
            updatedAt: now,
          })
          .where(eq(supportTickets.id, ticket.id))
          .run();
      }
    });

    logSupportSync("synced tickets", { count: pendingTickets.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logSupportSync("sync failed", message);

    db.transaction((tx) => {
      for (const ticket of pendingTickets) {
        tx.update(supportTickets)
          .set({
            syncError: message,
            updatedAt: now,
          })
          .where(eq(supportTickets.id, ticket.id))
          .run();
      }
    });
  }
}
