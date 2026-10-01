const pad = (n) => String(n).padStart(2, "0");

// Stored as local time text, 'YYYY-MM-DD HH:MM:SS', so "today" is the shop's today.
export function stamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export const today = () => stamp().slice(0, 10);

export function rs(n) {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString("en-PK");
}

export const money = (n) => `Rs ${rs(n)}`;

export function qtyText(q) {
  const v = Number(q) || 0;
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, "");
}

// '2026-10-01 11:42:05' -> '01-10-2026'
export function dateText(s) {
  if (!s) return "";
  const [y, m, d] = s.slice(0, 10).split("-");
  return `${d}-${m}-${y}`;
}

// '2026-10-01 11:42:05' -> '11:42 AM'
export function timeText(s) {
  if (!s) return "";
  let [h, m] = s.slice(11, 16).split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${ap}`;
}

export function dayLabel(s) {
  const d = s.slice(0, 10);
  if (d === today()) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d === stamp(y).slice(0, 10)) return "Yesterday";
  return dateText(s);
}

export const billNo = (id) => String(id).padStart(4, "0");

// Accepts '0300-1234567', '03001234567', '+92 300 1234567'. Returns '923001234567' or ''.
export function waNumber(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("92") && d.length === 12) return d;
  if (d.startsWith("0") && d.length === 11) return "92" + d.slice(1);
  if (d.length === 10 && d.startsWith("3")) return "92" + d;
  return "";
}

export const toInt = (s) => {
  const v = parseInt(String(s ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(v) ? v : 0;
};

export const toQty = (s) => {
  const v = parseFloat(String(s ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(v) ? v : 0;
};

export const hasUrdu = (s) => /[؀-ۿ]/.test(String(s || ""));
