import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const syncColumns = {
  syncStatus: text("sync_status").notNull().default("pending"),
  syncAction: text("sync_action").notNull().default("create"),
  remoteId: text("remote_id"),
  syncVersion: integer("sync_version").notNull().default(0),
  lastSyncedAt: text("last_synced_at"),
  syncError: text("sync_error"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
};

export const deviceInfo = sqliteTable("device_info", {
  id: text("id").primaryKey(),
  deviceId: text("device_id").notNull(),
  deviceName: text("device_name"),
  installationId: text("installation_id").notNull(),
  platform: text("platform"),
  appVersion: text("app_version"),
  lastSyncCursor: text("last_sync_cursor"),
  lastSyncedAt: text("last_synced_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const appActivityEvents = sqliteTable(
  "app_activity_events",
  {
    id: text("id").primaryKey(),
    installationId: text("installation_id").notNull(),
    deviceId: text("device_id").notNull(),
    deviceName: text("device_name"),
    platform: text("platform"),
    appVersion: text("app_version"),
    openedAt: text("opened_at").notNull(),
    syncedAt: text("synced_at"),
    syncStatus: text("sync_status").notNull().default("pending"),
    syncError: text("sync_error"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("app_activity_events_sync_status_idx").on(table.syncStatus),
    index("app_activity_events_opened_at_idx").on(table.openedAt),
  ],
);

export const supportTickets = sqliteTable(
  "support_tickets",
  {
    id: text("id").primaryKey(),
    installationId: text("installation_id").notNull(),
    deviceId: text("device_id").notNull(),
    deviceName: text("device_name"),
    platform: text("platform"),
    appVersion: text("app_version"),
    name: text("name"),
    email: text("email"),
    message: text("message").notNull(),
    status: text("status").notNull().default("open"),
    syncedAt: text("synced_at"),
    syncStatus: text("sync_status").notNull().default("pending"),
    syncError: text("sync_error"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("support_tickets_sync_status_idx").on(table.syncStatus),
    index("support_tickets_created_at_idx").on(table.createdAt),
  ],
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().default("set your name"),
    appTheme: text("app_theme").notNull().default("system"),
    currency: text("currency").notNull().default("€"),
    profileImageUri: text("profile_image_uri"),
    ...syncColumns,
  },
  (table) => [
    index("users_sync_status_idx").on(table.syncStatus),
    uniqueIndex("users_remote_id_idx").on(table.remoteId),
  ],
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    icon: text("icon"),
    color: text("color"),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(false),
    ...syncColumns,
  },
  (table) => [
    index("categories_sync_status_idx").on(table.syncStatus),
    uniqueIndex("categories_remote_id_idx").on(table.remoteId),
  ],
);

export const receipts = sqliteTable(
  "receipts",
  {
    id: text("id").primaryKey(),
    store: text("store").notNull(),
    categoryId: text("category_id").references(() => categories.id),
    categoryName: text("category_name"),
    addressJson: text("address_json"),
    dateText: text("date_text"),
    total: real("total").notNull().default(0),
    paymentMethod: text("payment_method"),
    cardLast4: text("card_last4"),
    itemCount: integer("item_count").notNull().default(0),
    rawText: text("raw_text"),
    imageUri: text("image_uri"),
    note: text("note"),
    ...syncColumns,
  },
  (table) => [
    index("receipts_category_id_idx").on(table.categoryId),
    index("receipts_date_text_idx").on(table.dateText),
    index("receipts_sync_status_idx").on(table.syncStatus),
    uniqueIndex("receipts_remote_id_idx").on(table.remoteId),
  ],
);

export const receiptItems = sqliteTable(
  "receipt_items",
  {
    id: text("id").primaryKey(),
    receiptId: text("receipt_id")
      .notNull()
      .references(() => receipts.id, { onDelete: "cascade" }),
    categoryId: text("category_id").references(() => categories.id),
    lineIndex: integer("line_index").notNull(),
    name: text("name").notNull(),
    quantity: real("quantity"),
    unitPrice: real("unit_price"),
    weightKg: real("weight_kg"),
    price: real("price").notNull().default(0),
    vatCode: text("vat_code"),
    ...syncColumns,
  },
  (table) => [
    index("receipt_items_receipt_id_idx").on(table.receiptId),
    index("receipt_items_category_id_idx").on(table.categoryId),
    index("receipt_items_sync_status_idx").on(table.syncStatus),
    uniqueIndex("receipt_items_remote_id_idx").on(table.remoteId),
  ],
);

export const receiptVat = sqliteTable(
  "receipt_vat",
  {
    id: text("id").primaryKey(),
    receiptId: text("receipt_id")
      .notNull()
      .references(() => receipts.id, { onDelete: "cascade" }),
    lineIndex: integer("line_index").notNull(),
    rate: real("rate").notNull().default(0),
    net: real("net").notNull().default(0),
    tax: real("tax").notNull().default(0),
    ...syncColumns,
  },
  (table) => [
    index("receipt_vat_receipt_id_idx").on(table.receiptId),
    index("receipt_vat_sync_status_idx").on(table.syncStatus),
    uniqueIndex("receipt_vat_remote_id_idx").on(table.remoteId),
  ],
);

export const receiptParserHints = sqliteTable(
  "receipt_parser_hints",
  {
    id: text("id").primaryKey(),
    pattern: text("pattern").notNull(),
    store: text("store").notNull(),
    sampleHeader: text("sample_header"),
    useCount: integer("use_count").notNull().default(1),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("receipt_parser_hints_pattern_idx").on(table.pattern)],
);

export const monthlyBudgets = sqliteTable(
  "monthly_budgets",
  {
    id: text("id").primaryKey(),
    monthKey: text("month_key").notNull(),
    limitAmount: real("limit_amount").notNull().default(0),
    spentAmount: real("spent_amount").notNull().default(0),
    currency: text("currency").notNull().default("EUR"),
    ...syncColumns,
  },
  (table) => [
    uniqueIndex("monthly_budgets_month_key_idx").on(table.monthKey),
    index("monthly_budgets_sync_status_idx").on(table.syncStatus),
    uniqueIndex("monthly_budgets_remote_id_idx").on(table.remoteId),
  ],
);

export const categoryBudgets = sqliteTable(
  "category_budgets",
  {
    id: text("id").primaryKey(),
    monthlyBudgetId: text("monthly_budget_id")
      .notNull()
      .references(() => monthlyBudgets.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    limitAmount: real("limit_amount").notNull().default(0),
    spentAmount: real("spent_amount").notNull().default(0),
    ...syncColumns,
  },
  (table) => [
    index("category_budgets_monthly_budget_id_idx").on(table.monthlyBudgetId),
    index("category_budgets_category_id_idx").on(table.categoryId),
    index("category_budgets_sync_status_idx").on(table.syncStatus),
    uniqueIndex("category_budgets_remote_id_idx").on(table.remoteId),
  ],
);

export const syncOutbox = sqliteTable(
  "sync_outbox",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    operation: text("operation").notNull(),
    payloadJson: text("payload_json").notNull(),
    status: text("status").notNull().default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    nextAttemptAt: text("next_attempt_at"),
    lockedAt: text("locked_at"),
    lastError: text("last_error"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("sync_outbox_status_idx").on(table.status, table.nextAttemptAt),
    index("sync_outbox_entity_idx").on(table.entityType, table.entityId),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type AppActivityEvent = typeof appActivityEvents.$inferSelect;
export type NewAppActivityEvent = typeof appActivityEvents.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
export type ReceiptItem = typeof receiptItems.$inferSelect;
export type NewReceiptItem = typeof receiptItems.$inferInsert;
export type ReceiptVat = typeof receiptVat.$inferSelect;
export type NewReceiptVat = typeof receiptVat.$inferInsert;
export type ReceiptParserHint = typeof receiptParserHints.$inferSelect;
export type NewReceiptParserHint = typeof receiptParserHints.$inferInsert;
export type MonthlyBudget = typeof monthlyBudgets.$inferSelect;
export type NewMonthlyBudget = typeof monthlyBudgets.$inferInsert;
export type CategoryBudget = typeof categoryBudgets.$inferSelect;
export type NewCategoryBudget = typeof categoryBudgets.$inferInsert;
export type SyncOutboxItem = typeof syncOutbox.$inferSelect;
export type NewSyncOutboxItem = typeof syncOutbox.$inferInsert;
