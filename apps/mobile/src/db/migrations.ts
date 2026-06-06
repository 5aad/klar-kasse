import { sqlite } from "@/db/client";

let hasInitialized = false;

export function initializeDatabase() {
  if (hasInitialized) return;

  sqlite.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS device_info (
      id TEXT PRIMARY KEY NOT NULL,
      device_id TEXT NOT NULL,
      device_name TEXT,
      installation_id TEXT NOT NULL,
      platform TEXT,
      app_version TEXT,
      last_sync_cursor TEXT,
      last_synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_activity_events (
      id TEXT PRIMARY KEY NOT NULL,
      installation_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      device_name TEXT,
      platform TEXT,
      app_version TEXT,
      opened_at TEXT NOT NULL,
      synced_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY NOT NULL,
      installation_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      device_name TEXT,
      platform TEXT,
      app_version TEXT,
      name TEXT,
      email TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      synced_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL DEFAULT 'set your name',
      app_theme TEXT NOT NULL DEFAULT 'system',
      currency TEXT NOT NULL DEFAULT '€',
      profile_image_uri TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_action TEXT NOT NULL DEFAULT 'create',
      remote_id TEXT,
      sync_version INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      sync_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_action TEXT NOT NULL DEFAULT 'create',
      remote_id TEXT,
      sync_version INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      sync_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY NOT NULL,
      store TEXT NOT NULL,
      category_id TEXT REFERENCES categories(id),
      category_name TEXT,
      address_json TEXT,
      date_text TEXT,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT,
      card_last4 TEXT,
      item_count INTEGER NOT NULL DEFAULT 0,
      raw_text TEXT,
      image_uri TEXT,
      note TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_action TEXT NOT NULL DEFAULT 'create',
      remote_id TEXT,
      sync_version INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      sync_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS receipt_items (
      id TEXT PRIMARY KEY NOT NULL,
      receipt_id TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
      category_id TEXT REFERENCES categories(id),
      line_index INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity REAL,
      unit_price REAL,
      weight_kg REAL,
      price REAL NOT NULL DEFAULT 0,
      vat_code TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_action TEXT NOT NULL DEFAULT 'create',
      remote_id TEXT,
      sync_version INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      sync_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS receipt_vat (
      id TEXT PRIMARY KEY NOT NULL,
      receipt_id TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
      line_index INTEGER NOT NULL,
      rate REAL NOT NULL DEFAULT 0,
      net REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_action TEXT NOT NULL DEFAULT 'create',
      remote_id TEXT,
      sync_version INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      sync_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS receipt_llm_jobs (
      id TEXT PRIMARY KEY NOT NULL,
      receipt_id TEXT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending',
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS receipt_parser_hints (
      id TEXT PRIMARY KEY NOT NULL,
      pattern TEXT NOT NULL,
      store TEXT NOT NULL,
      sample_header TEXT,
      use_count INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS monthly_budgets (
      id TEXT PRIMARY KEY NOT NULL,
      month_key TEXT NOT NULL,
      limit_amount REAL NOT NULL DEFAULT 0,
      spent_amount REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'EUR',
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_action TEXT NOT NULL DEFAULT 'create',
      remote_id TEXT,
      sync_version INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      sync_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS category_budgets (
      id TEXT PRIMARY KEY NOT NULL,
      monthly_budget_id TEXT NOT NULL REFERENCES monthly_budgets(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL REFERENCES categories(id),
      limit_amount REAL NOT NULL DEFAULT 0,
      spent_amount REAL NOT NULL DEFAULT 0,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sync_action TEXT NOT NULL DEFAULT 'create',
      remote_id TEXT,
      sync_version INTEGER NOT NULL DEFAULT 0,
      last_synced_at TEXT,
      sync_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      next_attempt_at TEXT,
      locked_at TEXT,
      last_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS categories_sync_status_idx ON categories(sync_status);
    CREATE INDEX IF NOT EXISTS app_activity_events_sync_status_idx ON app_activity_events(sync_status);
    CREATE INDEX IF NOT EXISTS app_activity_events_opened_at_idx ON app_activity_events(opened_at);
    CREATE INDEX IF NOT EXISTS support_tickets_sync_status_idx ON support_tickets(sync_status);
    CREATE INDEX IF NOT EXISTS support_tickets_created_at_idx ON support_tickets(created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS categories_remote_id_idx ON categories(remote_id) WHERE remote_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS users_sync_status_idx ON users(sync_status);
    CREATE UNIQUE INDEX IF NOT EXISTS users_remote_id_idx ON users(remote_id) WHERE remote_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS receipts_category_id_idx ON receipts(category_id);
    CREATE INDEX IF NOT EXISTS receipts_date_text_idx ON receipts(date_text);
    CREATE INDEX IF NOT EXISTS receipts_sync_status_idx ON receipts(sync_status);
    CREATE UNIQUE INDEX IF NOT EXISTS receipts_remote_id_idx ON receipts(remote_id) WHERE remote_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS receipt_items_receipt_id_idx ON receipt_items(receipt_id);
    CREATE INDEX IF NOT EXISTS receipt_items_category_id_idx ON receipt_items(category_id);
    CREATE INDEX IF NOT EXISTS receipt_items_sync_status_idx ON receipt_items(sync_status);
    CREATE UNIQUE INDEX IF NOT EXISTS receipt_items_remote_id_idx ON receipt_items(remote_id) WHERE remote_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS receipt_vat_receipt_id_idx ON receipt_vat(receipt_id);
    CREATE INDEX IF NOT EXISTS receipt_vat_sync_status_idx ON receipt_vat(sync_status);
    CREATE UNIQUE INDEX IF NOT EXISTS receipt_vat_remote_id_idx ON receipt_vat(remote_id) WHERE remote_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS receipt_llm_jobs_receipt_id_idx ON receipt_llm_jobs(receipt_id);
    CREATE INDEX IF NOT EXISTS receipt_llm_jobs_status_idx ON receipt_llm_jobs(status, created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS receipt_parser_hints_pattern_idx ON receipt_parser_hints(pattern);
    CREATE UNIQUE INDEX IF NOT EXISTS monthly_budgets_month_key_idx ON monthly_budgets(month_key);
    CREATE INDEX IF NOT EXISTS monthly_budgets_sync_status_idx ON monthly_budgets(sync_status);
    CREATE UNIQUE INDEX IF NOT EXISTS monthly_budgets_remote_id_idx ON monthly_budgets(remote_id) WHERE remote_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS category_budgets_monthly_budget_id_idx ON category_budgets(monthly_budget_id);
    CREATE INDEX IF NOT EXISTS category_budgets_category_id_idx ON category_budgets(category_id);
    CREATE INDEX IF NOT EXISTS category_budgets_sync_status_idx ON category_budgets(sync_status);
    CREATE UNIQUE INDEX IF NOT EXISTS category_budgets_remote_id_idx ON category_budgets(remote_id) WHERE remote_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS sync_outbox_status_idx ON sync_outbox(status, next_attempt_at);
    CREATE INDEX IF NOT EXISTS sync_outbox_entity_idx ON sync_outbox(entity_type, entity_id);
  `);

  const receiptColumns = sqlite.getAllSync<{ name: string }>(
    "PRAGMA table_info(receipts)",
  );
  if (receiptColumns.some((column) => column.name === "time_text")) {
    sqlite.execSync("ALTER TABLE receipts DROP COLUMN time_text;");
  }

  const deviceInfoColumns = sqlite.getAllSync<{ name: string }>(
    "PRAGMA table_info(device_info)",
  );
  if (!deviceInfoColumns.some((column) => column.name === "device_name")) {
    sqlite.execSync("ALTER TABLE device_info ADD COLUMN device_name TEXT;");
  }

  const activityColumns = sqlite.getAllSync<{ name: string }>(
    "PRAGMA table_info(app_activity_events)",
  );
  if (!activityColumns.some((column) => column.name === "device_name")) {
    sqlite.execSync(
      "ALTER TABLE app_activity_events ADD COLUMN device_name TEXT;",
    );
  }

  sqlite.execSync("UPDATE users SET name = 'set your name' WHERE name = 'Tom Hillson';");
  sqlite.execSync("UPDATE users SET currency = '€' WHERE currency = 'EUR';");

  hasInitialized = true;
}
