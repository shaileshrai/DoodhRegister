import { sqlite } from "./index";

export function runMigrations() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      shift TEXT NOT NULL CHECK(shift IN ('MORNING','EVENING','OTHER')),
      rate REAL,
      default_quantity REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      joined_date TEXT NOT NULL,
      left_date TEXT,
      created_at TEXT NOT NULL DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      date TEXT NOT NULL,
      quantity_taken REAL NOT NULL DEFAULT 0,
      is_present INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(customer_id, date)
    );

    CREATE TABLE IF NOT EXISTS monthly_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      total_quantity REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'DUE' CHECK(payment_status IN ('PAID','DUE')),
      paid_date TEXT,
      notes TEXT,
      generated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(customer_id, year, month)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL CHECK(category IN ('FODDER','MEDICINE','REPAIRING','MANPOWER','POWER','OTHER')),
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profit_loss_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      total_revenue REAL NOT NULL DEFAULT 0,
      total_expenses REAL NOT NULL DEFAULT 0,
      net_profit REAL NOT NULL DEFAULT 0,
      generated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(year, month)
    );
  `);

  // Migration: add OTHER shift type and make rate/qty nullable
  const tableInfo = sqlite.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='customers'").get() as { sql: string } | undefined;
  if (tableInfo && (!tableInfo.sql.includes("'OTHER'") || tableInfo.sql.includes("rate REAL NOT NULL"))) {
    sqlite.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE customers_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        shift TEXT NOT NULL CHECK(shift IN ('MORNING','EVENING','OTHER')),
        rate REAL,
        default_quantity REAL,
        is_active INTEGER NOT NULL DEFAULT 1,
        joined_date TEXT NOT NULL,
        left_date TEXT,
        created_at TEXT NOT NULL DEFAULT (date('now'))
      );
      INSERT INTO customers_new SELECT * FROM customers;
      DROP TABLE customers;
      ALTER TABLE customers_new RENAME TO customers;
      COMMIT;
    `);
  }
}
