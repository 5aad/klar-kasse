# Mobile Offline Database ERD

```mermaid
erDiagram
  DEVICE_INFO {
    text id PK
    text device_id
    text installation_id
    text platform
    text app_version
    text last_sync_cursor
    text last_synced_at
    text created_at
    text updated_at
  }

  CATEGORIES {
    text id PK
    text name
    text icon
    text color
    text type
    integer is_default
    text sync_status
    text sync_action
    text remote_id
    integer sync_version
    text last_synced_at
    text sync_error
    text created_at
    text updated_at
    text deleted_at
  }

  RECEIPTS {
    text id PK
    text store
    text category_id FK
    text category_name
    text address_json
    text date_text
    text time_text
    real total
    text payment_method
    text card_last4
    integer item_count
    text raw_text
    text image_uri
    text note
    text sync_status
    text sync_action
    text remote_id
    integer sync_version
    text last_synced_at
    text sync_error
    text created_at
    text updated_at
    text deleted_at
  }

  RECEIPT_ITEMS {
    text id PK
    text receipt_id FK
    text category_id FK
    integer line_index
    text name
    real quantity
    real unit_price
    real weight_kg
    real price
    text vat_code
    text sync_status
    text sync_action
    text remote_id
    integer sync_version
    text last_synced_at
    text sync_error
    text created_at
    text updated_at
    text deleted_at
  }

  RECEIPT_VAT {
    text id PK
    text receipt_id FK
    integer line_index
    real rate
    real net
    real tax
    text sync_status
    text sync_action
    text remote_id
    integer sync_version
    text last_synced_at
    text sync_error
    text created_at
    text updated_at
    text deleted_at
  }

  MONTHLY_BUDGETS {
    text id PK
    text month_key
    real limit_amount
    real spent_amount
    text currency
    text sync_status
    text sync_action
    text remote_id
    integer sync_version
    text last_synced_at
    text sync_error
    text created_at
    text updated_at
    text deleted_at
  }

  CATEGORY_BUDGETS {
    text id PK
    text monthly_budget_id FK
    text category_id FK
    real limit_amount
    real spent_amount
    text sync_status
    text sync_action
    text remote_id
    integer sync_version
    text last_synced_at
    text sync_error
    text created_at
    text updated_at
    text deleted_at
  }

  SYNC_OUTBOX {
    text id PK
    text entity_type
    text entity_id
    text operation
    text payload_json
    text status
    integer retry_count
    text next_attempt_at
    text locked_at
    text last_error
    text created_at
    text updated_at
  }

  CATEGORIES ||--o{ RECEIPTS : categorizes
  CATEGORIES ||--o{ RECEIPT_ITEMS : categorizes
  RECEIPTS ||--o{ RECEIPT_ITEMS : contains
  RECEIPTS ||--o{ RECEIPT_VAT : has
  MONTHLY_BUDGETS ||--o{ CATEGORY_BUDGETS : contains
  CATEGORIES ||--o{ CATEGORY_BUDGETS : limits
```

## Notes

- `monthly_budgets` stores one budget per month, using `month_key` like `2026-05`.
- `category_budgets` stores category-level limits inside a monthly budget.
- `sync_outbox` is intentionally generic. It can queue create/update/delete operations for any synced table using `entity_type` and `entity_id`.
- `device_info` is standalone because it identifies the local installation and sync cursor rather than business data.
