// The money and stock rules live here, in SQLite, not in the screens.
// A screen can have a bug; a trigger refuses the bad row whatever called it.
// Refusals are short codes; src/lib/refusals.js turns them into sentences with figures.
//
// Sign convention for the khata: balance = SUM(debit - credit).
//   Customer: positive balance = he owes us (udhaar).
//   Supplier: negative balance = we owe him.

export const SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id        INTEGER PRIMARY KEY,
  name_en   TEXT NOT NULL CHECK (length(trim(name_en)) > 0),
  name_ur   TEXT NOT NULL DEFAULT '',
  unit_en   TEXT NOT NULL CHECK (length(trim(unit_en)) > 0),
  unit_ur   TEXT NOT NULL DEFAULT '',
  rate      INTEGER NOT NULL CHECK (rate >= 0),
  stock     REAL NOT NULL DEFAULT 0,
  low_alert REAL NOT NULL DEFAULT 0 CHECK (low_alert >= 0)
);

CREATE TABLE IF NOT EXISTS parties (
  id         INTEGER PRIMARY KEY,
  kind       TEXT NOT NULL CHECK (kind IN ('customer', 'supplier')),
  name_en    TEXT NOT NULL CHECK (length(trim(name_en)) > 0),
  name_ur    TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  walk_in    INTEGER NOT NULL DEFAULT 0 CHECK (walk_in IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bills (
  id         INTEGER PRIMARY KEY,
  party_id   INTEGER NOT NULL REFERENCES parties(id),
  created_at TEXT NOT NULL,
  lang       TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'ur')),
  subtotal   INTEGER NOT NULL CHECK (subtotal > 0),
  discount   INTEGER NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total      INTEGER NOT NULL,
  previous   INTEGER NOT NULL,
  received   INTEGER NOT NULL DEFAULT 0 CHECK (received >= 0),
  CHECK (total = subtotal - discount),
  CHECK (total >= 0)
);

CREATE TABLE IF NOT EXISTS bill_lines (
  id      INTEGER PRIMARY KEY,
  bill_id INTEGER NOT NULL REFERENCES bills(id),
  item_id INTEGER NOT NULL REFERENCES items(id),
  qty     REAL NOT NULL CHECK (qty > 0),
  rate    INTEGER NOT NULL CHECK (rate >= 0),
  amount  INTEGER NOT NULL,
  CHECK (amount = CAST(round(qty * rate) AS INTEGER))
);

CREATE TABLE IF NOT EXISTS purchases (
  id         INTEGER PRIMARY KEY,
  party_id   INTEGER REFERENCES parties(id),
  item_id    INTEGER NOT NULL REFERENCES items(id),
  created_at TEXT NOT NULL,
  qty        REAL NOT NULL CHECK (qty > 0),
  rate       INTEGER NOT NULL CHECK (rate >= 0),
  total      INTEGER NOT NULL,
  paid       INTEGER NOT NULL DEFAULT 0 CHECK (paid >= 0),
  CHECK (total = CAST(round(qty * rate) AS INTEGER)),
  CHECK (party_id IS NOT NULL OR paid = total)
);

CREATE TABLE IF NOT EXISTS stock_moves (
  id          INTEGER PRIMARY KEY,
  item_id     INTEGER NOT NULL REFERENCES items(id),
  qty         REAL NOT NULL CHECK (qty <> 0),
  kind        TEXT NOT NULL CHECK (kind IN ('opening', 'sale', 'purchase', 'adjust')),
  bill_id     INTEGER REFERENCES bills(id),
  purchase_id INTEGER REFERENCES purchases(id),
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger (
  id          INTEGER PRIMARY KEY,
  party_id    INTEGER NOT NULL REFERENCES parties(id),
  created_at  TEXT NOT NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('opening', 'bill', 'received', 'purchase', 'paid')),
  debit       INTEGER NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit      INTEGER NOT NULL DEFAULT 0 CHECK (credit >= 0),
  bill_id     INTEGER REFERENCES bills(id),
  purchase_id INTEGER REFERENCES purchases(id),
  note        TEXT NOT NULL DEFAULT '',
  CHECK (debit > 0 OR credit > 0)
);

CREATE TABLE IF NOT EXISTS cash (
  id          INTEGER PRIMARY KEY,
  created_at  TEXT NOT NULL,
  dir         TEXT NOT NULL CHECK (dir IN ('in', 'out')),
  amount      INTEGER NOT NULL CHECK (amount > 0),
  category    TEXT NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  party_id    INTEGER REFERENCES parties(id),
  bill_id     INTEGER REFERENCES bills(id),
  purchase_id INTEGER REFERENCES purchases(id)
);

CREATE INDEX IF NOT EXISTS ledger_party ON ledger(party_id, created_at);
CREATE INDEX IF NOT EXISTS bills_date ON bills(created_at);
CREATE INDEX IF NOT EXISTS cash_date ON cash(created_at);

CREATE VIEW IF NOT EXISTS party_balances AS
  SELECT p.*, COALESCE(SUM(l.debit - l.credit), 0) AS balance, MAX(l.created_at) AS last_at
  FROM parties p LEFT JOIN ledger l ON l.party_id = p.id
  GROUP BY p.id;

-- Stock can never go below zero.
CREATE TRIGGER IF NOT EXISTS stock_guard BEFORE INSERT ON stock_moves
WHEN (SELECT stock FROM items WHERE id = NEW.item_id) + NEW.qty < -0.0001
BEGIN SELECT RAISE(ABORT, 'STOCK_SHORT'); END;

CREATE TRIGGER IF NOT EXISTS stock_apply AFTER INSERT ON stock_moves
BEGIN UPDATE items SET stock = stock + NEW.qty WHERE id = NEW.item_id; END;

-- A bill's "previous balance" must be the khata balance at the moment it is saved.
CREATE TRIGGER IF NOT EXISTS bill_previous_guard BEFORE INSERT ON bills
WHEN NEW.previous <> (SELECT COALESCE(SUM(debit - credit), 0) FROM ledger WHERE party_id = NEW.party_id)
BEGIN SELECT RAISE(ABORT, 'PREVIOUS_MISMATCH'); END;

-- Bills go to customers only.
CREATE TRIGGER IF NOT EXISTS bill_customer_guard BEFORE INSERT ON bills
WHEN (SELECT kind FROM parties WHERE id = NEW.party_id) <> 'customer'
BEGIN SELECT RAISE(ABORT, 'NOT_CUSTOMER'); END;

-- A walk-in cash customer has no khata, so he pays the full bill.
CREATE TRIGGER IF NOT EXISTS walkin_guard BEFORE INSERT ON bills
WHEN (SELECT walk_in FROM parties WHERE id = NEW.party_id) = 1 AND NEW.received <> NEW.total
BEGIN SELECT RAISE(ABORT, 'WALKIN_UNPAID'); END;

CREATE TRIGGER IF NOT EXISTS walkin_ledger_guard BEFORE INSERT ON ledger
WHEN (SELECT walk_in FROM parties WHERE id = NEW.party_id) = 1 AND NEW.kind NOT IN ('bill', 'received')
BEGIN SELECT RAISE(ABORT, 'WALKIN_NO_KHATA'); END;

-- History is append-only: a mistake is corrected by a new entry, never by editing an old one.
CREATE TRIGGER IF NOT EXISTS ledger_no_update BEFORE UPDATE ON ledger BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS ledger_no_delete BEFORE DELETE ON ledger BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS stock_no_update BEFORE UPDATE ON stock_moves BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS stock_no_delete BEFORE DELETE ON stock_moves BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS bills_no_update BEFORE UPDATE ON bills BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS bills_no_delete BEFORE DELETE ON bills BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS cash_no_update BEFORE UPDATE ON cash BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY'); END;
CREATE TRIGGER IF NOT EXISTS cash_no_delete BEFORE DELETE ON cash BEGIN SELECT RAISE(ABORT, 'APPEND_ONLY'); END;
-- Stock only changes through stock_moves.
CREATE TRIGGER IF NOT EXISTS items_stock_guard BEFORE UPDATE OF stock ON items
WHEN NEW.stock <> OLD.stock + COALESCE((SELECT qty FROM stock_moves WHERE id = (SELECT MAX(id) FROM stock_moves) AND item_id = NEW.id), 0)
BEGIN SELECT RAISE(ABORT, 'STOCK_DIRECT'); END;
`;
