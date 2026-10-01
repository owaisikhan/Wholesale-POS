import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { F } from "../theme";
import { billNo, dateText, qtyText, rs, timeText } from "../lib/format";

// The 58mm cash memo, the design the client approved (design/memo/memo.html).
// Drawn 384 px wide = the MPT-II's 384 printable dots, pure black on white,
// so the captured image prints 1:1 and Urdu needs no printer font.
export const MEMO_WIDTH = 384;

export const LABELS = {
  en: { memo: "CASH MEMO", billNo: "Bill #", date: "Date", customer: "Customer", phone: "Phone",
        item: "Item", qty: "Qty", rate: "Rate", amt: "Amount", items: "Items", subtotal: "Subtotal", discount: "Discount",
        bill: "Bill Total", previous: "Previous Balance", total: "Total Due", received: "Received",
        balance: "Remaining Balance", advance: "Advance", thanks: "Thank you! Please visit again." },
  ur: { memo: "کیش میمو", billNo: "بل نمبر", date: "تاریخ", customer: "گاہک", phone: "فون",
        item: "آئٹم", qty: "تعداد", rate: "ریٹ", amt: "رقم", items: "آئٹمز", subtotal: "کل رقم", discount: "رعایت",
        bill: "بل کی رقم", previous: "پچھلا بقایا", total: "کل واجب الادا", received: "وصول",
        balance: "باقی بقایا", advance: "ایڈوانس", thanks: "شکریہ! دوبارہ تشریف لائیں" },
};

export const Memo = forwardRef(function Memo({ bill, shop, lang = "en", demo }, ref) {
  const ur = lang === "ur";
  const t = LABELS[lang];
  const due = bill.total + bill.previous;
  const left = due - bill.received;
  const name = (en, u) => (ur && u ? u : en);
  const dir = ur ? "row-reverse" : "row";

  const W = ({ children, b, size, style }) => (
    <Text style={[ur ? st.ur : st.en, b && (ur ? st.urB : st.enB), size && { fontSize: size, lineHeight: Math.round(size * (ur ? 2.1 : 1.3)) }, style]}>{children}</Text>
  );
  const N = ({ children, b, size, style }) => (
    <Text style={[st.num, b && st.numB, size && { fontSize: size }, style]}>{children}</Text>
  );
  const KV = ({ k, v, big }) => (
    <View style={[st.kv, { flexDirection: dir }]}>
      <W b={big} size={big ? 17 : undefined}>{k}</W>
      {v}
    </View>
  );
  const Rule = ({ solid }) => <View style={[st.rule, solid && { borderStyle: "solid" }]} />;

  return (
    <View ref={ref} collapsable={false} style={st.memo}>
      <View style={st.center}>
        <W b size={ur ? 25 : 26} style={!ur && { letterSpacing: 1 }}>{ur ? shop.shop_ur : shop.shop_en}</W>
        {ur ? (
          // Nastaliq glyphs reach past their advance width, so in Urdu the phone gets its own line.
          <>
            <W size={14}>{shop.city_ur}  |  {shop.owner_ur}</W>
            <N size={15} b>{shop.phone}</N>
          </>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <W size={14}>{shop.city_en} | {shop.owner_en}</W>
            <N size={14}>{shop.phone}</N>
          </View>
        )}
        <W size={13}>{ur ? shop.tag_ur : shop.tag_en}</W>
      </View>

      <View style={st.title}>
        <Text style={[ur ? st.urB : st.enB, { color: "#fff", fontSize: ur ? 16 : 16, letterSpacing: ur ? 0 : 2, textAlign: "center" }]}>
          {t.memo}{demo ? (ur ? " (ڈیمو)" : " (DEMO)") : ""}
        </Text>
      </View>

      <KV k={t.billNo} v={<N b>{billNo(bill.id)}</N>} />
      <KV k={t.date} v={<N>{dateText(bill.created_at)}   {timeText(bill.created_at)}</N>} />
      <Rule />
      <KV k={t.customer} v={<W b style={{ flexShrink: 1, textAlign: ur ? "left" : "right" }}>{name(bill.party_en, bill.party_ur)}</W>} />
      {bill.party_phone ? <KV k={t.phone} v={<N>{bill.party_phone}</N>} /> : null}
      <Rule />

      <View style={[st.tr, st.th, { flexDirection: dir }]}>
        <W b size={14} style={st.cItem}>{t.item}</W>
        <W b size={14} style={[st.cQty, endAlign(ur)]}>{t.qty}</W>
        <W b size={14} style={[st.cRate, endAlign(ur)]}>{t.rate}</W>
        <W b size={14} style={[st.cAmt, endAlign(ur)]}>{t.amt}</W>
      </View>
      {bill.lines.map((l, i) => (
        <View key={l.id} style={[st.tr, i > 0 && st.dotTop, { flexDirection: dir }]}>
          <W b={!ur} style={[st.cItem, { textAlign: ur ? "right" : "left" }]}>{name(l.name_en, l.name_ur)}</W>
          <View style={[st.cQty, { alignItems: ur ? "flex-start" : "flex-end" }]}>
            <N>{qtyText(l.qty)}</N>
            <W size={12} style={[ur && { lineHeight: 22 }, { textAlign: ur ? "left" : "right" }]}>{name(l.unit_en, l.unit_ur)}</W>
          </View>
          <N style={[st.cRate, endAlign(ur)]}>{rs(l.rate)}</N>
          <N style={[st.cAmt, endAlign(ur)]}>{rs(l.amount)}</N>
        </View>
      ))}
      <Rule solid />

      <KV k={`${t.items}: ${bill.lines.length}`} v={null} />
      <KV k={t.subtotal} v={<N>{rs(bill.subtotal)}</N>} />
      {bill.discount > 0 ? <KV k={t.discount} v={<N>- {rs(bill.discount)}</N>} /> : null}
      <View style={[st.grand, { flexDirection: dir }]}>
        <W b size={ur ? 18 : 19}>{t.bill}</W>
        <N b size={20}>Rs {rs(bill.total)}</N>
      </View>
      {bill.walk_in ? null : (
        <>
          <KV k={t.previous} v={<N>{rs(bill.previous)}</N>} />
          <KV k={t.total} v={<N b>{rs(due)}</N>} />
        </>
      )}
      <KV k={t.received} v={<N>{rs(bill.received)}</N>} />
      {bill.walk_in ? null : (
        <>
          <Rule />
          <KV big k={left < 0 ? t.advance : t.balance} v={<N b size={17}>Rs {rs(Math.abs(left))}</N>} />
        </>
      )}
      <Rule />
      <W b size={ur ? 15 : 16} style={{ textAlign: "center", marginTop: 6 }}>{t.thanks}</W>
      <Text style={[st.en, { fontSize: 11, textAlign: "center", marginTop: 4 }]}>Software by Kodexa | kodexa.store</Text>
    </View>
  );
});

const endAlign = (ur) => ({ textAlign: ur ? "left" : "right" });

const st = StyleSheet.create({
  memo: { width: MEMO_WIDTH, backgroundColor: "#fff", paddingHorizontal: 12, paddingTop: 14, paddingBottom: 18 },
  center: { alignItems: "center" },
  en: { fontFamily: F.cond, fontSize: 15, lineHeight: 20, color: "#000" },
  enB: { fontFamily: F.condB },
  ur: { fontFamily: F.ur, fontSize: 14, lineHeight: 30, color: "#000", writingDirection: "rtl" },
  urB: { fontFamily: F.urB },
  num: { fontFamily: F.condM, fontSize: 15, lineHeight: 20, color: "#000" },
  numB: { fontFamily: F.condB },
  title: { backgroundColor: "#000", marginTop: 8, marginBottom: 6, paddingVertical: 3, alignItems: "center" },
  kv: { justifyContent: "space-between", alignItems: "center", gap: 8, paddingVertical: 1 },
  rule: { borderTopWidth: 2, borderStyle: "dashed", borderColor: "#000", marginVertical: 6 },
  tr: { alignItems: "center", paddingVertical: 4, gap: 4 },
  th: { borderBottomWidth: 2, borderColor: "#000" },
  dotTop: { borderTopWidth: 1, borderStyle: "dotted", borderColor: "#000" },
  cItem: { flex: 1 },
  cQty: { width: 78 },
  cRate: { width: 56 },
  cAmt: { width: 70 },
  grand: { justifyContent: "space-between", alignItems: "center", borderWidth: 2, borderColor: "#000", paddingHorizontal: 8, paddingVertical: 4, marginVertical: 6 },
});
