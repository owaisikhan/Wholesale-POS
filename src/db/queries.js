import { today } from "../lib/format";

export const listItems = (db) => db.getAllAsync("SELECT * FROM items ORDER BY id");

export const lowStock = (db) => db.getAllAsync("SELECT * FROM items WHERE stock <= low_alert ORDER BY stock / MAX(low_alert, 1)");

export const listParties = (db, kind) =>
  db.getAllAsync("SELECT * FROM party_balances WHERE kind = ? ORDER BY walk_in DESC, name_en", kind);

export const getParty = (db, id) => db.getFirstAsync("SELECT * FROM party_balances WHERE id = ?", id);

export const partyLedger = (db, id) =>
  db.getAllAsync(
    `SELECT l.*, SUM(l.debit - l.credit) OVER (ORDER BY l.created_at, l.id) AS running
     FROM ledger l WHERE l.party_id = ? ORDER BY l.created_at DESC, l.id DESC`,
    id,
  );

export async function getBill(db, id) {
  const bill = await db.getFirstAsync(
    `SELECT b.*, p.name_en AS party_en, p.name_ur AS party_ur, p.phone AS party_phone, p.walk_in
     FROM bills b JOIN parties p ON p.id = b.party_id WHERE b.id = ?`,
    id,
  );
  if (!bill) return null;
  bill.lines = await db.getAllAsync(
    `SELECT bl.*, i.name_en, i.name_ur, i.unit_en, i.unit_ur
     FROM bill_lines bl JOIN items i ON i.id = bl.item_id WHERE bl.bill_id = ? ORDER BY bl.id`,
    id,
  );
  return bill;
}

export const recentBills = (db, limit = 6) =>
  db.getAllAsync(
    `SELECT b.id, b.created_at, b.total, b.received, p.name_en, p.name_ur, p.walk_in
     FROM bills b JOIN parties p ON p.id = b.party_id ORDER BY b.id DESC LIMIT ?`,
    limit,
  );

export async function dashboard(db) {
  const d = today();
  const sale = await db.getFirstAsync(
    "SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS n FROM bills WHERE substr(created_at, 1, 10) = ?", d);
  const cashToday = await db.getFirstAsync(
    `SELECT COALESCE(SUM(CASE WHEN dir = 'in' THEN amount END), 0) AS cin,
            COALESCE(SUM(CASE WHEN dir = 'out' THEN amount END), 0) AS cout,
            COALESCE(SUM(CASE WHEN category = 'Recovery' THEN amount END), 0) AS recovery
     FROM cash WHERE substr(created_at, 1, 10) = ?`, d);
  const inHand = await cashInHand(db);
  const udhaar = await db.getFirstAsync(
    "SELECT COALESCE(SUM(balance), 0) AS total, COUNT(*) AS n FROM party_balances WHERE kind = 'customer' AND balance > 0");
  const payable = await db.getFirstAsync(
    "SELECT COALESCE(-SUM(balance), 0) AS total FROM party_balances WHERE kind = 'supplier' AND balance < 0");
  return { sale, cashToday, inHand, udhaar, payable };
}

export async function cashInHand(db) {
  const r = await db.getFirstAsync(
    `SELECT COALESCE(SUM(CASE WHEN dir = 'in' THEN amount ELSE -amount END), 0) AS v FROM cash`);
  const opening = await db.getFirstAsync("SELECT value FROM settings WHERE key = 'opening_cash'");
  return r.v + (opening ? Number(opening.value) : 0);
}

export const cashEntries = (db, onlyToday) =>
  db.getAllAsync(
    `SELECT c.*, p.name_en AS party_en FROM cash c LEFT JOIN parties p ON p.id = c.party_id
     ${onlyToday ? "WHERE substr(c.created_at, 1, 10) = ?" : ""}
     ORDER BY c.created_at DESC, c.id DESC LIMIT 200`,
    ...(onlyToday ? [today()] : []),
  );

export const stockHistory = (db, limit = 30) =>
  db.getAllAsync(
    `SELECT m.*, i.name_en, i.unit_en, p.name_en AS party_en, pu.rate AS p_rate
     FROM stock_moves m JOIN items i ON i.id = m.item_id
     LEFT JOIN purchases pu ON pu.id = m.purchase_id
     LEFT JOIN parties p ON p.id = pu.party_id
     ORDER BY m.created_at DESC, m.id DESC LIMIT ?`,
    limit,
  );

export async function getShop(db) {
  const rows = await db.getAllAsync("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
