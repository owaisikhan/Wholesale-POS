import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { AlertTriangle, PackagePlus, Pencil, Plus } from "../../components/icons";
import { Header } from "../../components/Header";
import { Btn, Card, Chip, Field, Notice, Row, Sheet, T } from "../../components/ui";
import { useDb, useQuery } from "../../db/DbProvider";
import { listItems, listParties, stockHistory } from "../../db/queries";
import { addItem, adjustStock, stockIn, updateItem } from "../../db/actions";
import { explain } from "../../lib/refusals";
import { dayLabel, money, qtyText, rs, timeText, toInt, toQty } from "../../lib/format";
import { C } from "../../theme";

export default function Stock() {
  const items = useQuery(listItems);
  const moves = useQuery((db) => stockHistory(db, 25));
  const [inFor, setInFor] = useState(null); // item for Stock In, or true for "choose"
  const [edit, setEdit] = useState(null); // item, or "new"

  const value = (items || []).reduce((a, i) => a + i.stock * i.rate, 0);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Stock" sub={`Stock value at sale rate: ${money(value)}`}
        right={<Btn kind="accent" icon={Plus} title="Item" onPress={() => setEdit("new")} style={{ marginRight: 4, minHeight: 44 }} />} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32, maxWidth: 640, width: "100%", alignSelf: "center" }}>
        <Btn kind="primary" size="lg" icon={PackagePlus} title="Stock In (maal aaya)" onPress={() => setInFor(true)} />
        {items?.map((i) => {
          const low = i.stock <= i.low_alert;
          return (
            <Card key={i.id} style={[{ gap: 8 }, low && { borderColor: C.turmeric, borderWidth: 2 }]}>
              <Row style={{ alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <T w="sb" size={16}>{i.name_en}</T>
                  {i.name_ur ? <T size={14} color={C.inkSoft}>{i.name_ur}</T> : null}
                  <T size={13} color={C.muted}>Rate Rs {rs(i.rate)} / {i.unit_en} | alert below {qtyText(i.low_alert)}</T>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <T w="b" size={22} color={low ? C.red : C.ink}>{qtyText(i.stock)}</T>
                  <T size={12} color={C.muted}>{i.unit_en}</T>
                </View>
              </Row>
              {low ? (
                <Row gap={6} style={{ backgroundColor: C.turmericSoft, padding: 8, borderRadius: 8 }}>
                  <AlertTriangle size={16} color={C.ink} />
                  <T size={14} w="sb">Low stock. Order more.</T>
                </Row>
              ) : null}
              <Row gap={8}>
                <Btn kind="ghost" icon={PackagePlus} title="Stock In" onPress={() => setInFor(i)} style={{ flex: 1 }} />
                <Btn kind="ghost" icon={Pencil} title="Edit" onPress={() => setEdit(i)} style={{ flex: 1 }} />
              </Row>
            </Card>
          );
        })}

        <T w="b" size={17} style={{ marginTop: 10 }}>Stock in / out history</T>
        <Card style={{ padding: 0 }}>
          {moves?.map((m, idx) => (
            <Row key={m.id} style={{ padding: 12, borderTopWidth: idx ? 1 : 0, borderColor: C.line }}>
              <View style={{ flex: 1 }}>
                <T w="sb" size={15} numberOfLines={1}>{m.name_en}</T>
                <T size={13} color={C.muted}>
                  {MOVE[m.kind]}{m.party_en ? ` from ${m.party_en}` : ""}{m.bill_id ? ` bill #${String(m.bill_id).padStart(4, "0")}` : ""} | {dayLabel(m.created_at)} {timeText(m.created_at)}
                </T>
              </View>
              <T w="b" size={16} color={m.qty > 0 ? C.green : C.ink}>{m.qty > 0 ? "+" : "-"}{qtyText(Math.abs(m.qty))}</T>
            </Row>
          ))}
        </Card>
      </ScrollView>
      <StockInSheet target={inFor} items={items || []} onClose={() => setInFor(null)} />
      <ItemSheet target={edit} onClose={() => setEdit(null)} />
    </View>
  );
}

const MOVE = { sale: "Sold", purchase: "Stock in", opening: "Opening stock", adjust: "Count correction" };

function StockInSheet({ target, items, onClose }) {
  const { db, changed } = useDb();
  const suppliers = useQuery((d) => listParties(d, "supplier"));
  const [itemId, setItemId] = useState(null);
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [sup, setSup] = useState(null);
  const [paid, setPaid] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target) {
      setItemId(target === true ? null : target.id);
      setQty(""); setRate(""); setPaid(""); setError(""); setSup(null);
    }
  }, [target]);

  const total = Math.round(toQty(qty) * toInt(rate));
  const item = items.find((i) => i.id === itemId);

  async function save() {
    if (!item) return setError("Choose the item.");
    if (toQty(qty) <= 0) return setError("Write how many came.");
    const p = sup ? Math.min(toInt(paid), total) : total;
    setBusy(true);
    try {
      await stockIn(db, { itemId, qty: toQty(qty), rate: toInt(rate), partyId: sup, paid: p });
      changed();
      onClose();
    } catch (e) {
      setError(await explain(db, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={!!target} onClose={onClose} title="Stock In" footer={<Btn title="Save stock" size="lg" busy={busy} onPress={save} />}>
      <T w="sb" size={14} color={C.inkSoft}>Item</T>
      <Row gap={8} style={{ flexWrap: "wrap" }}>
        {items.map((i) => <Chip key={i.id} label={i.name_en} on={i.id === itemId} onPress={() => setItemId(i.id)} />)}
      </Row>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Field label={`Quantity${item ? ` (${item.unit_en})` : ""}`} value={qty} onChangeText={setQty} keyboard="decimal-pad" placeholder="e.g. 20" style={{ flex: 1 }} />
        <Field label="Buying rate (Rs)" value={rate} onChangeText={setRate} keyboard="numeric" placeholder="e.g. 2100" style={{ flex: 1 }} />
      </Row>
      <T size={15}>Total cost: <T w="b" size={15}>{money(total)}</T></T>
      <T w="sb" size={14} color={C.inkSoft}>From supplier</T>
      <Row gap={8} style={{ flexWrap: "wrap" }}>
        <Chip label="Paid cash (no khata)" on={sup === null} onPress={() => setSup(null)} />
        {suppliers?.map((s) => <Chip key={s.id} label={s.name_en} on={sup === s.id} onPress={() => setSup(s.id)} />)}
      </Row>
      {sup ? (
        <Field label="Paid now (Rs)" value={paid} onChangeText={setPaid} keyboard="numeric" placeholder="e.g. 0 if on credit"
          hint={`Rest (${money(Math.max(0, total - toInt(paid)))}) is added to the supplier's khata.`} />
      ) : <T size={13} color={C.muted}>Full cost is taken from cash in hand.</T>}
      {error ? <Notice>{error}</Notice> : null}
    </Sheet>
  );
}

function ItemSheet({ target, onClose }) {
  const { db, changed } = useDb();
  const isNew = target === "new";
  const [f, setF] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (!target) return;
    setError("");
    setF(isNew
      ? { name_en: "", name_ur: "", unit_en: "", unit_ur: "", rate: "", stock: "", low_alert: "" }
      : { ...target, rate: String(target.rate), low_alert: qtyText(target.low_alert), count: qtyText(target.stock) });
  }, [target, isNew]);

  async function save() {
    if (!f.name_en?.trim()) return setError("Write the item name.");
    if (!f.unit_en?.trim()) return setError("Write the unit, e.g. Carton, Bori, Kg.");
    const data = { ...f, rate: toInt(f.rate), low_alert: toQty(f.low_alert) };
    setBusy(true);
    try {
      if (isNew) await addItem(db, { ...data, stock: toQty(f.stock) });
      else {
        await updateItem(db, data);
        const diff = toQty(f.count) - target.stock;
        if (f.count !== "" && Math.abs(diff) > 0.0001) await adjustStock(db, { itemId: target.id, qty: diff });
      }
      changed();
      onClose();
    } catch (e) {
      setError(await explain(db, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={!!target} onClose={onClose} title={isNew ? "Add item" : "Edit item"}
      footer={<Btn title="Save item" size="lg" busy={busy} onPress={save} />}>
      <Field label="Item name (English)" value={f.name_en} onChangeText={set("name_en")} placeholder="e.g. Surf 500g" />
      <Field label="Item name in Urdu" value={f.name_ur} onChangeText={set("name_ur")} placeholder="مثلاً سرف 500 گرام" />
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Field label="Unit (English)" value={f.unit_en} onChangeText={set("unit_en")} placeholder="e.g. Carton" style={{ flex: 1 }} />
        <Field label="Unit in Urdu" value={f.unit_ur} onChangeText={set("unit_ur")} placeholder="مثلاً کارٹن" style={{ flex: 1 }} />
      </Row>
      <Row gap={10} style={{ alignItems: "flex-start" }}>
        <Field label="Sale rate (Rs)" value={f.rate} onChangeText={set("rate")} keyboard="numeric" placeholder="e.g. 2350" style={{ flex: 1 }} />
        <Field label="Alert below" value={f.low_alert} onChangeText={set("low_alert")} keyboard="decimal-pad" placeholder="e.g. 10" style={{ flex: 1 }} />
      </Row>
      {isNew ? (
        <Field label="Stock you have now" value={f.stock} onChangeText={set("stock")} keyboard="decimal-pad" placeholder="e.g. 25" />
      ) : (
        <Field label="Counted stock" value={f.count} onChangeText={set("count")} keyboard="decimal-pad"
          hint="Change only if your physical count is different. The difference is saved as a count correction." />
      )}
      {error ? <Notice>{error}</Notice> : null}
    </Sheet>
  );
}
