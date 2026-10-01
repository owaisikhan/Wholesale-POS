import { billNo, dateText, qtyText, rs } from "./format";

// WhatsApp text versions of the memo and the khata statement.
export function billText(bill, shop, lang = "en") {
  const ur = lang === "ur";
  const due = bill.total + bill.previous;
  const left = due - bill.received;
  const lines = bill.lines.map((l) =>
    `${ur && l.name_ur ? l.name_ur : l.name_en}: ${qtyText(l.qty)} x ${rs(l.rate)} = ${rs(l.amount)}`);
  if (ur) {
    return [
      `*${shop.shop_ur}* (${shop.city_ur})`,
      `بل نمبر ${billNo(bill.id)} | ${dateText(bill.created_at)}`,
      "",
      ...lines,
      "",
      `بل کی رقم: Rs ${rs(bill.total)}`,
      ...(bill.walk_in ? [] : [`پچھلا بقایا: Rs ${rs(bill.previous)}`]),
      `وصول: Rs ${rs(bill.received)}`,
      ...(bill.walk_in ? [] : [`*باقی بقایا: Rs ${rs(left)}*`]),
      "",
      `شکریہ! ${shop.owner_ur} ${shop.phone}`,
    ].join("\n");
  }
  return [
    `*${shop.shop_en}* (${shop.city_en})`,
    `Bill #${billNo(bill.id)} | ${dateText(bill.created_at)}`,
    "",
    ...lines,
    "",
    `Bill Total: Rs ${rs(bill.total)}`,
    ...(bill.walk_in ? [] : [`Previous Balance: Rs ${rs(bill.previous)}`]),
    `Received: Rs ${rs(bill.received)}`,
    ...(bill.walk_in ? [] : [`*Remaining Balance: Rs ${rs(left)}*`]),
    "",
    `Thank you! ${shop.owner_en} ${shop.phone}`,
  ].join("\n");
}

export function statementText(party, entries, shop) {
  const last = entries.slice(0, 8).map((e) => {
    const amt = e.debit ? `+${rs(e.debit)}` : `-${rs(e.credit)}`;
    return `${dateText(e.created_at)}  ${KIND[e.kind]}  ${amt}`;
  });
  return [
    `*${shop.shop_en}*`,
    `Khata: ${party.name_en}`,
    "",
    ...last,
    "",
    `*Balance: Rs ${rs(party.balance)}*`,
    "",
    `${shop.owner_en} ${shop.phone}`,
  ].join("\n");
}

export const KIND = {
  opening: "Opening",
  bill: "Bill",
  received: "Received",
  purchase: "Purchase",
  paid: "Paid",
};
