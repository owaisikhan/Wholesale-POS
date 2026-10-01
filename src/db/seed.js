import { stamp } from "../lib/format";
import { addItem, addParty, createBill, recordPayment, stockIn, addCash, setSetting } from "./actions";

// Demo data for Sohana Traders. Items and customers are placeholders; the
// client replaces them with his own. Phone numbers are deliberately fake
// (0300-0000xxx) and the demo never sends a WhatsApp to a stored number.

export const SHOP = {
  shop_en: "SOHANA TRADERS",
  shop_ur: "سوھان ٹریڈرس",
  owner_en: "Sunil Kumar",
  owner_ur: "سنیل کمار",
  city_en: "Sukkur",
  city_ur: "سکھر",
  phone: "0331-3151751",
  tag_en: "Wholesale rates",
  tag_ur: "ہول سیل ریٹ پر دستیاب",
};

const ITEMS = [
  { name_en: "Washing Powder 1kg", name_ur: "واشنگ پاؤڈر 1 کلو", unit_en: "Ctn (20 pc)", unit_ur: "کارٹن (20 پیس)", rate: 2350, stock: 46, low_alert: 10 },
  { name_en: "Washing Tel 1L", name_ur: "واشنگ تیل 1 لیٹر", unit_en: "Bottle", unit_ur: "بوتل", rate: 180, stock: 140, low_alert: 48 },
  { name_en: "Soda 25kg", name_ur: "سوڈا 25 کلو", unit_en: "Bori", unit_ur: "بوری", rate: 2750, stock: 16, low_alert: 6 },
  { name_en: "Amchoor", name_ur: "آمچور", unit_en: "Kg", unit_ur: "کلو", rate: 650, stock: 30, low_alert: 8 },
  { name_en: "Garam Masala", name_ur: "گرم مصالحہ", unit_en: "Kg", unit_ur: "کلو", rate: 1400, stock: 14, low_alert: 6 },
];

const CUSTOMERS = [
  ["Bismillah Kiryana Store", "بسم اللہ کریانہ اسٹور", 8200],
  ["Madina General Store", "مدینہ جنرل اسٹور", 15400],
  ["Ali Traders Rohri", "علی ٹریڈرز روہڑی", 0],
  ["Sindh Kiryana", "سندھ کریانہ", 22750],
  ["Shah Jee Store", "شاہ جی اسٹور", 4300],
  ["Mehran Mart", "مہران مارٹ", 0],
  ["Al-Habib Store", "الحبیب اسٹور", 11800],
  ["Pak Kiryana Pano Aqil", "پاک کریانہ پنوعاقل", 6500],
  ["Usman Store", "عثمان اسٹور", 0],
  ["Bhutto Colony Store", "بھٹو کالونی اسٹور", 2900],
  ["Lakhani General", "لاکھانی جنرل", 18600],
  ["New Sukkur Mart", "نیو سکھر مارٹ", 3700],
];

const SUPPLIERS = [
  ["Lever Distributor Hyderabad", "لیور ڈسٹری بیوٹر حیدرآباد", 45000],
  ["Karachi Masala House", "کراچی مصالحہ ہاؤس", 12000],
];

// Small deterministic random so every demo visitor sees the same shop.
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function at(daysAgo, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export async function seed(db) {
  for (const [k, v] of Object.entries(SHOP)) await setSetting(db, k, v);
  await setSetting(db, "memo_lang", "en");
  await setSetting(db, "opening_cash", 25000);

  const start = stamp(at(8, 9, 0));
  const itemIds = [];
  for (const it of ITEMS) itemIds.push(await addItem(db, { ...it, at: start }));

  await addParty(db, { kind: "customer", name_en: "Cash Customer", name_ur: "نقد گاہک", walk_in: 1, at: start });
  const custIds = [];
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const [en, ur, opening] = CUSTOMERS[i];
    custIds.push(await addParty(db, {
      kind: "customer", name_en: en, name_ur: ur, opening, at: start,
      phone: `0300-0000${String(101 + i)}`,
    }));
  }
  const supIds = [];
  for (let i = 0; i < SUPPLIERS.length; i++) {
    const [en, ur, opening] = SUPPLIERS[i];
    supIds.push(await addParty(db, { kind: "supplier", name_en: en, name_ur: ur, opening, phone: `0300-0000${201 + i}`, at: start }));
  }

  const rand = rng(1751);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const stock = ITEMS.map((i) => i.stock);
  const now = new Date();

  for (let day = 6; day >= 0; day--) {
    // Today's sample bills fall in shop hours (from 9 AM) and before now. Before
    // 10 AM there are none yet, so a late-night visitor never sees 12:05 AM bills.
    const open = at(0, 9, 0).getTime();
    const room = now.getTime() - 5 * 60000 - open;
    const nBills = day === 0 ? (room > 60 * 60000 ? 3 : 0) : 2 + Math.floor(rand() * 3);
    for (let b = 0; b < nBills; b++) {
      let when = at(day, 9 + b * 2 + Math.floor(rand() * 2), Math.floor(rand() * 60));
      if (day === 0) when = new Date(open + (room * (b + 1)) / (nBills + 1));

      const nLines = 1 + Math.floor(rand() * 3);
      const used = new Set();
      const lines = [];
      for (let l = 0; l < nLines; l++) {
        const idx = Math.floor(rand() * ITEMS.length);
        if (used.has(idx)) continue;
        used.add(idx);
        const max = idx === 1 ? 24 : 4;
        const qty = Math.min(1 + Math.floor(rand() * max), Math.floor(stock[idx] - ITEMS[idx].low_alert / 2));
        if (qty <= 0) continue;
        stock[idx] -= qty;
        lines.push({ itemId: itemIds[idx], qty, rate: ITEMS[idx].rate });
      }
      if (!lines.length) continue;
      const subtotal = lines.reduce((a, l) => a + l.qty * l.rate, 0);
      const discount = subtotal > 8000 && rand() > 0.5 ? Math.round((subtotal * 0.01) / 10) * 10 : 0;
      const total = subtotal - discount;
      const r = rand();
      const received = r < 0.35 ? 0 : r < 0.7 ? Math.round(total / 2 / 500) * 500 : total;
      await createBill(db, { partyId: pick(custIds), lines, discount, received, at: stamp(when) });
    }

    if (day > 0 && rand() > 0.3) {
      const amount = (2 + Math.floor(rand() * 8)) * 1000;
      await recordPayment(db, { partyId: pick(custIds), amount, at: stamp(at(day, 17, Math.floor(rand() * 50))) });
    }
    if (day > 0) {
      await addCash(db, { dir: "out", amount: 300 + Math.floor(rand() * 4) * 100, category: "Loading / Rickshaw", at: stamp(at(day, 13, 10)) });
    }
  }

  await stockIn(db, { itemId: itemIds[1], qty: 96, rate: 150, partyId: supIds[0], paid: 6000, at: stamp(at(3, 11, 20)) });
  await stockIn(db, { itemId: itemIds[3], qty: 10, rate: 540, partyId: supIds[1], paid: 0, at: stamp(at(2, 12, 5)) });
  await recordPayment(db, { partyId: supIds[0], amount: 15000, note: "Bank transfer", at: stamp(at(1, 16, 30)) });
  await addCash(db, { dir: "out", amount: 2500, category: "Electricity bill", at: stamp(at(4, 15, 0)) });
  await addCash(db, { dir: "out", amount: 5000, category: "Owner (ghar kharch)", at: stamp(at(2, 19, 0)) });
}
