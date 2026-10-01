import { stamp } from "../lib/format";

// Every write that touches more than one table runs in one transaction:
// a bill either changes stock, khata and cash together, or changes nothing.

const balanceOf = async (db, partyId) =>
  (await db.getFirstAsync("SELECT COALESCE(SUM(debit - credit), 0) AS b FROM ledger WHERE party_id = ?", partyId)).b;

export async function createBill(db, { partyId, lines, discount = 0, received = 0, lang = "en", at = stamp() }) {
  let billId;
  await db.withTransactionAsync(async () => {
    const subtotal = lines.reduce((a, l) => a + Math.round(l.qty * l.rate), 0);
    const total = subtotal - discount;
    const previous = await balanceOf(db, partyId);
    const r = await db.runAsync(
      "INSERT INTO bills (party_id, created_at, lang, subtotal, discount, total, previous, received) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      partyId, at, lang, subtotal, discount, total, previous, received,
    );
    billId = r.lastInsertRowId;
    for (const l of lines) {
      await db.runAsync(
        "INSERT INTO bill_lines (bill_id, item_id, qty, rate, amount) VALUES (?, ?, ?, ?, ?)",
        billId, l.itemId, l.qty, l.rate, Math.round(l.qty * l.rate),
      );
      await db.runAsync(
        "INSERT INTO stock_moves (item_id, qty, kind, bill_id, created_at) VALUES (?, ?, 'sale', ?, ?)",
        l.itemId, -l.qty, billId, at,
      );
    }
    if (total > 0) {
      await db.runAsync(
        "INSERT INTO ledger (party_id, created_at, kind, debit, bill_id) VALUES (?, ?, 'bill', ?, ?)",
        partyId, at, total, billId,
      );
    }
    if (received > 0) {
      await db.runAsync(
        "INSERT INTO ledger (party_id, created_at, kind, credit, bill_id) VALUES (?, ?, 'received', ?, ?)",
        partyId, at, received, billId,
      );
      await db.runAsync(
        "INSERT INTO cash (created_at, dir, amount, category, party_id, bill_id) VALUES (?, 'in', ?, 'Sale', ?, ?)",
        at, received, partyId, billId,
      );
    }
  });
  return billId;
}

// Recovery from a customer (cash in) or payment to a supplier (cash out).
export async function recordPayment(db, { partyId, amount, note = "", at = stamp() }) {
  await db.withTransactionAsync(async () => {
    const p = await db.getFirstAsync("SELECT kind FROM parties WHERE id = ?", partyId);
    if (p.kind === "customer") {
      await db.runAsync("INSERT INTO ledger (party_id, created_at, kind, credit, note) VALUES (?, ?, 'received', ?, ?)", partyId, at, amount, note);
      await db.runAsync("INSERT INTO cash (created_at, dir, amount, category, note, party_id) VALUES (?, 'in', ?, 'Recovery', ?, ?)", at, amount, note, partyId);
    } else {
      await db.runAsync("INSERT INTO ledger (party_id, created_at, kind, debit, note) VALUES (?, ?, 'paid', ?, ?)", partyId, at, amount, note);
      await db.runAsync("INSERT INTO cash (created_at, dir, amount, category, note, party_id) VALUES (?, 'out', ?, 'Supplier payment', ?, ?)", at, amount, note, partyId);
    }
  });
}

export async function stockIn(db, { itemId, qty, rate, partyId = null, paid = 0, at = stamp() }) {
  await db.withTransactionAsync(async () => {
    const total = Math.round(qty * rate);
    const r = await db.runAsync(
      "INSERT INTO purchases (party_id, item_id, created_at, qty, rate, total, paid) VALUES (?, ?, ?, ?, ?, ?, ?)",
      partyId, itemId, at, qty, rate, total, paid,
    );
    const pid = r.lastInsertRowId;
    await db.runAsync("INSERT INTO stock_moves (item_id, qty, kind, purchase_id, created_at) VALUES (?, ?, 'purchase', ?, ?)", itemId, qty, pid, at);
    if (partyId && total > 0) {
      await db.runAsync("INSERT INTO ledger (party_id, created_at, kind, credit, purchase_id) VALUES (?, ?, 'purchase', ?, ?)", partyId, at, total, pid);
    }
    if (partyId && paid > 0) {
      await db.runAsync("INSERT INTO ledger (party_id, created_at, kind, debit, purchase_id) VALUES (?, ?, 'paid', ?, ?)", partyId, at, paid, pid);
    }
    if (paid > 0) {
      await db.runAsync("INSERT INTO cash (created_at, dir, amount, category, party_id, purchase_id) VALUES (?, 'out', ?, 'Stock purchase', ?, ?)", at, paid, partyId, pid);
    }
  });
}

export async function addCash(db, { dir, amount, category, note = "", at = stamp() }) {
  await db.runAsync("INSERT INTO cash (created_at, dir, amount, category, note) VALUES (?, ?, ?, ?, ?)", at, dir, amount, category, note);
}

export async function addItem(db, { name_en, name_ur, unit_en, unit_ur, rate, stock = 0, low_alert = 0, at = stamp() }) {
  let id;
  await db.withTransactionAsync(async () => {
    const r = await db.runAsync(
      "INSERT INTO items (name_en, name_ur, unit_en, unit_ur, rate, low_alert) VALUES (?, ?, ?, ?, ?, ?)",
      name_en.trim(), (name_ur || "").trim(), unit_en.trim(), (unit_ur || "").trim(), rate, low_alert,
    );
    id = r.lastInsertRowId;
    if (stock > 0) await db.runAsync("INSERT INTO stock_moves (item_id, qty, kind, created_at) VALUES (?, ?, 'opening', ?)", id, stock, at);
  });
  return id;
}

export async function updateItem(db, { id, name_en, name_ur, unit_en, unit_ur, rate, low_alert }) {
  await db.runAsync(
    "UPDATE items SET name_en = ?, name_ur = ?, unit_en = ?, unit_ur = ?, rate = ?, low_alert = ? WHERE id = ?",
    name_en.trim(), (name_ur || "").trim(), unit_en.trim(), (unit_ur || "").trim(), rate, low_alert, id,
  );
}

// Physical count differs from the app: record the difference as an adjustment.
export async function adjustStock(db, { itemId, qty, at = stamp() }) {
  if (!qty) return;
  await db.runAsync("INSERT INTO stock_moves (item_id, qty, kind, created_at) VALUES (?, ?, 'adjust', ?)", itemId, qty, at);
}

export async function addParty(db, { kind, name_en, name_ur = "", phone = "", opening = 0, walk_in = 0, at = stamp() }) {
  let id;
  await db.withTransactionAsync(async () => {
    const r = await db.runAsync(
      "INSERT INTO parties (kind, name_en, name_ur, phone, walk_in, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      kind, name_en.trim(), name_ur.trim(), phone.trim(), walk_in, at,
    );
    id = r.lastInsertRowId;
    if (opening) {
      // Customer opening = he owes us (debit). Supplier opening = we owe him (credit).
      const col = kind === "customer" ? "debit" : "credit";
      await db.runAsync(`INSERT INTO ledger (party_id, created_at, kind, ${col}, note) VALUES (?, ?, 'opening', ?, 'Opening balance')`, id, at, Math.abs(opening));
    }
  });
  return id;
}

export async function getSetting(db, key, fallback = "") {
  const r = await db.getFirstAsync("SELECT value FROM settings WHERE key = ?", key);
  return r ? r.value : fallback;
}

export async function setSetting(db, key, value) {
  await db.runAsync("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", key, String(value));
}
