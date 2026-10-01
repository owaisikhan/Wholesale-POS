import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronDown, Minus, Plus, Search, Trash2 } from "../../components/icons";
import { Header } from "../../components/Header";
import { Btn, Card, Chip, Field, Notice, Row, Segmented, Sheet, T } from "../../components/ui";
import { useDb, useQuery } from "../../db/DbProvider";
import { listItems, listParties } from "../../db/queries";
import { createBill, getSetting, setSetting } from "../../db/actions";
import { explain } from "../../lib/refusals";
import { money, qtyText, rs, toInt, toQty } from "../../lib/format";
import { C, F, R } from "../../theme";

export default function NewBill() {
  const { db, changed } = useDb();
  const items = useQuery(listItems);
  const customers = useQuery((d) => listParties(d, "customer"));

  const [partyId, setPartyId] = useState(null);
  const [lines, setLines] = useState({}); // itemId -> { qty: string, rate: string }
  const [discount, setDiscount] = useState("");
  const [received, setReceived] = useState("");
  const [lang, setLang] = useState("en");
  const [pick, setPick] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { getSetting(db, "memo_lang", "en").then(setLang); }, [db]);

  // Opened from a customer's khata: start the bill for him.
  const { party: fromParty } = useLocalSearchParams();
  useEffect(() => { if (fromParty) setPartyId(Number(fromParty)); }, [fromParty]);

  const party = customers?.find((c) => c.id === partyId);
  const rows = (items || []).filter((i) => lines[i.id]).map((i) => {
    const l = lines[i.id];
    const qty = toQty(l.qty), rate = toInt(l.rate);
    return { item: i, qty, rate, amount: Math.round(qty * rate), raw: l };
  });
  const subtotal = rows.reduce((a, r) => a + r.amount, 0);
  const disc = Math.min(toInt(discount), subtotal);
  const total = subtotal - disc;
  const previous = party?.balance || 0;
  const due = total + (party?.walk_in ? 0 : previous);
  const got = toInt(received);
  const left = due - got;

  const setLine = (id, patch) => setLines((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const add = (i) => {
    setError("");
    setLines((s) => {
      const cur = s[i.id];
      const q = cur ? toQty(cur.qty) + 1 : 1;
      return { ...s, [i.id]: { qty: qtyText(q), rate: cur ? cur.rate : String(i.rate) } };
    });
  };
  const step = (i, d) => {
    const q = toQty(lines[i.id].qty) + d;
    if (q <= 0) return remove(i.id);
    setLine(i.id, { qty: qtyText(q) });
  };
  const remove = (id) => setLines((s) => { const n = { ...s }; delete n[id]; return n; });

  const reset = () => { setLines({}); setDiscount(""); setReceived(""); setPartyId(null); setError(""); };

  async function save() {
    setError("");
    if (!party) return setError("Choose the customer first.");
    if (!rows.length) return setError("Add at least one item.");
    if (rows.some((r) => r.qty <= 0)) return setError("Every item needs a quantity more than 0.");
    const paid = party.walk_in ? total : got;
    const payload = { partyId, lines: rows.map((r) => ({ itemId: r.item.id, qty: r.qty, rate: r.rate })), discount: disc, received: paid, lang };
    setBusy(true);
    try {
      const id = await createBill(db, payload);
      await setSetting(db, "memo_lang", lang);
      changed();
      reset();
      router.push(`/memo/${id}`);
    } catch (e) {
      setError(await explain(db, e, payload));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Header title="New Bill" sub="Choose customer, tap items, save" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40, maxWidth: 640, width: "100%", alignSelf: "center" }} keyboardShouldPersistTaps="handled">
        <Card onPress={() => setPick(true)} style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 64, borderColor: party ? C.line : C.navy, borderWidth: party ? 1 : 2 }}>
          <View style={{ flex: 1 }}>
            <T size={13} w="sb" color={C.muted}>Customer</T>
            {party ? (
              <>
                <T w="b" size={17}>{party.name_en}</T>
                {!party.walk_in ? <T size={14} color={previous > 0 ? C.red : C.muted}>{previous < 0 ? `Advance: ${money(-previous)}` : `Previous balance: ${money(previous)}`}</T> : <T size={14} color={C.muted}>Pays full amount, no khata</T>}
              </>
            ) : <T w="b" size={17} color={C.navy}>Tap to choose customer</T>}
          </View>
          <ChevronDown size={22} color={C.ink} />
        </Card>

        <T w="b" size={17}>Items</T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {items?.map((i) => {
            const inBill = lines[i.id];
            const low = i.stock <= i.low_alert;
            return (
              <Pressable key={i.id} onPress={() => add(i)} accessibilityRole="button" accessibilityLabel={`Add ${i.name_en}`}
                style={({ pressed }) => [{
                  flexGrow: 1, flexBasis: "45%", minWidth: 140, minHeight: 84, padding: 12, borderRadius: R.md, borderWidth: inBill ? 2 : 1,
                  borderColor: inBill ? C.navy : C.line, backgroundColor: pressed ? C.turmericSoft : C.card, gap: 2,
                }]}>
                <T w="sb" size={15} numberOfLines={2}>{i.name_en}</T>
                <T size={14} color={C.inkSoft}>Rs {rs(i.rate)} / {i.unit_en}</T>
                <T size={12} w={low ? "sb" : "r"} color={low ? C.red : C.muted}>{low ? "Low: " : "Stock: "}{qtyText(i.stock)}</T>
                {inBill ? (
                  <View style={{ position: "absolute", top: 8, right: 8, backgroundColor: C.navy, borderRadius: 12, minWidth: 24, height: 24, paddingHorizontal: 6, alignItems: "center", justifyContent: "center" }}>
                    <T w="b" size={13} color="#fff">{inBill.qty}</T>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {rows.length ? (
          <Card style={{ padding: 0 }}>
            {rows.map((r, idx) => (
              <View key={r.item.id} style={{ padding: 12, gap: 8, borderTopWidth: idx ? 1 : 0, borderColor: C.line }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <T w="sb" size={16} style={{ flex: 1 }}>{r.item.name_en}</T>
                  <T w="b" size={16}>{money(r.amount)}</T>
                  <Pressable onPress={() => remove(r.item.id)} accessibilityRole="button" accessibilityLabel={`Remove ${r.item.name_en}`}
                    style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -8 }}>
                    <Trash2 size={20} color={C.red} />
                  </Pressable>
                </Row>
                <Row gap={6}>
                  <Step icon={Minus} label="Less" onPress={() => step(r.item, -1)} />
                  <SmallInput value={r.raw.qty} onChangeText={(v) => setLine(r.item.id, { qty: v })} width={58} label="Quantity" decimal />
                  <Step icon={Plus} label="More" onPress={() => step(r.item, 1)} />
                  <View style={{ flex: 1 }} />
                  <T size={14} color={C.muted}>Rate</T>
                  <SmallInput value={r.raw.rate} onChangeText={(v) => setLine(r.item.id, { rate: v })} width={80} label="Rate" />
                </Row>
                <T size={12} color={C.muted}>{r.item.unit_en} | in stock {qtyText(r.item.stock)}</T>
              </View>
            ))}
          </Card>
        ) : (
          <T size={14} color={C.muted}>Tap an item above to add it. Tap again to add one more.</T>
        )}

        <Row gap={10} style={{ alignItems: "flex-start" }}>
          <Field label="Discount (Rs)" value={discount} onChangeText={setDiscount} keyboard="numeric" placeholder="e.g. 100" style={{ flex: 1 }} />
          {party?.walk_in ? null : (
            <Field label="Cash received (Rs)" value={received} onChangeText={setReceived} keyboard="numeric" placeholder="e.g. 5000" style={{ flex: 1 }} />
          )}
        </Row>
        {party && !party.walk_in && total > 0 ? (
          <Row gap={8} style={{ flexWrap: "wrap" }}>
            <Chip label="Udhaar (0)" on={received === "" || got === 0} onPress={() => setReceived("")} />
            <Chip label={`Bill ${rs(total)}`} on={got === total} onPress={() => setReceived(String(total))} />
            {previous > 0 ? <Chip label={`Full ${rs(due)}`} on={got === due} onPress={() => setReceived(String(due))} /> : null}
          </Row>
        ) : null}

        <Card style={{ gap: 6 }}>
          <Line k="Subtotal" v={money(subtotal)} />
          {disc ? <Line k="Discount" v={`- ${money(disc)}`} /> : null}
          <Line k="Bill total" v={money(total)} b />
          {party && !party.walk_in ? (
            <>
              <Line k={previous < 0 ? "Advance (minus)" : "Previous balance"} v={previous < 0 ? `- ${money(-previous)}` : money(previous)} />
              <Line k="Total due" v={money(due)} />
              <Line k="Received" v={money(got)} />
              <View style={{ height: 1, backgroundColor: C.line, marginVertical: 2 }} />
              <Line k={left < 0 ? "Advance" : "Remaining balance"} v={money(Math.abs(left))} b big />
            </>
          ) : party?.walk_in ? <Line k="Received (cash)" v={money(total)} /> : null}
        </Card>

        <View style={{ gap: 6 }}>
          <T w="sb" size={14} color={C.inkSoft}>Memo language</T>
          <Segmented value={lang} onChange={setLang} options={[{ value: "en", label: "English" }, { value: "ur", label: "اردو" }]} />
        </View>

        {error ? <Notice>{error}</Notice> : null}
        <Btn title="Save and show memo" kind="primary" size="lg" busy={busy} onPress={save} />
        {rows.length ? <Btn title="Clear bill" kind="ghost" onPress={reset} /> : null}
      </ScrollView>

      <CustomerPicker visible={pick} customers={customers || []} onClose={() => setPick(false)}
        onPick={(c) => { setPartyId(c.id); setPick(false); setError(""); }} />
    </View>
  );
}

function CustomerPicker({ visible, customers, onClose, onPick }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return customers.filter((c) => !s || c.name_en.toLowerCase().includes(s) || c.name_ur.includes(q.trim()) || c.phone.includes(s));
  }, [q, customers]);
  return (
    <Sheet visible={visible} onClose={onClose} title="Choose customer">
      <Field value={q} onChangeText={setQ} placeholder="Search name or phone" right={<Search size={20} color={C.muted} />} />
      {list.map((c) => (
        <Card key={c.id} onPress={() => { setQ(""); onPick(c); }} style={{ flexDirection: "row", alignItems: "center", minHeight: 60, gap: 8 }}>
          <View style={{ flex: 1 }}>
            <T w="sb" size={16}>{c.name_en}</T>
            {c.walk_in ? <T size={13} color={C.muted}>Walk-in, pays cash</T> : <T size={13} color={C.muted}>{c.phone}</T>}
          </View>
          {!c.walk_in ? <T w="b" size={15} color={c.balance > 0 ? C.red : C.muted}>{c.balance < 0 ? `Advance ${money(-c.balance)}` : money(c.balance)}</T> : null}
        </Card>
      ))}
      {!list.length ? <T color={C.muted}>No customer found. Add new customers in the Khata tab.</T> : null}
    </Sheet>
  );
}

function Step({ icon: Icon, onPress, label }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: R.sm, borderWidth: 1.5, borderColor: C.lineStrong, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? C.paper : C.card })}>
      <Icon size={20} color={C.ink} />
    </Pressable>
  );
}

function SmallInput({ value, onChangeText, width, label, decimal }) {
  return (
    <TextInput value={value} onChangeText={onChangeText} accessibilityLabel={label}
      keyboardType={decimal ? "decimal-pad" : "numeric"} inputMode={decimal ? "decimal" : "numeric"} selectTextOnFocus
      style={{ width, height: 44, borderWidth: 1.5, borderColor: C.lineStrong, borderRadius: R.sm, textAlign: "center", fontFamily: F.condB, fontSize: 18, color: C.ink, backgroundColor: C.card, outlineStyle: "none" }} />
  );
}

function Line({ k, v, b, big }) {
  return (
    <Row style={{ justifyContent: "space-between" }}>
      <T size={big ? 17 : 15} w={b ? "b" : "r"}>{k}</T>
      <T size={big ? 19 : 15} w={b ? "b" : "sb"}>{v}</T>
    </Row>
  );
}
