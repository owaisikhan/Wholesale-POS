import { qtyText } from "./format";

// The database refuses with a short code; this adds the sentence and the figures.
export async function explain(db, e, ctx = {}) {
  const msg = String(e?.message || e);
  let code = (msg.match(/[A-Z_]{5,}/) || [])[0];
  // The web build of SQLite drops the RAISE text ("Error finalizing statement"),
  // so when the code is missing, find which rule the save broke from the figures.
  if (!code) code = await diagnose(db, ctx);
  switch (code) {
    case "STOCK_SHORT": {
      if (ctx.lines) {
        for (const l of ctx.lines) {
          const it = await db.getFirstAsync("SELECT name_en, unit_en, stock FROM items WHERE id = ?", l.itemId);
          if (it && l.qty > it.stock) return `Not enough stock: ${it.name_en}. You have ${qtyText(it.stock)} ${it.unit_en}, the bill needs ${qtyText(l.qty)}. Add stock first (Stock tab, Stock In).`;
        }
      }
      return "Not enough stock for this. Add stock first (Stock tab, Stock In).";
    }
    case "WALKIN_UNPAID":
      return "A cash customer has no khata, so the full bill must be received. Choose a shop from the customer list to sell on udhaar.";
    case "WALKIN_NO_KHATA":
      return "The cash customer has no khata.";
    case "PREVIOUS_MISMATCH":
      return "The customer's balance changed while the bill was open. Please save again.";
    case "NOT_CUSTOMER":
      return "Bills can only be made for customers, not suppliers.";
    case "APPEND_ONLY":
      return "Saved entries cannot be changed. Add a new entry to correct it.";
    default:
      return "Could not save. " + msg.replace(/^.*?Error:\s*/, "");
  }
}

async function diagnose(db, ctx) {
  for (const l of ctx.lines || []) {
    const it = await db.getFirstAsync("SELECT stock FROM items WHERE id = ?", l.itemId);
    if (it && l.qty > it.stock + 0.0001) return "STOCK_SHORT";
  }
  if (ctx.partyId) {
    const p = await db.getFirstAsync("SELECT kind, walk_in FROM parties WHERE id = ?", ctx.partyId);
    if (p?.kind === "supplier" && ctx.lines) return "NOT_CUSTOMER";
    if (p?.walk_in && ctx.lines) {
      const sub = ctx.lines.reduce((a, l) => a + Math.round(l.qty * l.rate), 0);
      if (ctx.received !== sub - (ctx.discount || 0)) return "WALKIN_UNPAID";
    }
  }
  return null;
}
