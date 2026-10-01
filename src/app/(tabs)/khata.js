import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { ChevronRight, Search, UserPlus } from "../../components/icons";
import { Header } from "../../components/Header";
import { Btn, Card, Field, Notice, Row, Segmented, Sheet, T } from "../../components/ui";
import { useDb, useQuery } from "../../db/DbProvider";
import { listParties } from "../../db/queries";
import { addParty } from "../../db/actions";
import { explain } from "../../lib/refusals";
import { dayLabel, money, toInt } from "../../lib/format";
import { C } from "../../theme";

export default function Khata() {
  const [kind, setKind] = useState("customer");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("balance");
  const [adding, setAdding] = useState(false);
  const parties = useQuery((db) => listParties(db, kind), [kind]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = (parties || []).filter((p) => !p.walk_in && (!s || p.name_en.toLowerCase().includes(s) || p.name_ur.includes(q.trim()) || p.phone.includes(s)));
    // Customers: who owes most first. Suppliers: who we owe most first.
    if (sort === "balance") rows.sort((a, b) => (kind === "customer" ? b.balance - a.balance : a.balance - b.balance));
    else rows.sort((a, b) => a.name_en.localeCompare(b.name_en));
    return rows;
  }, [parties, q, sort, kind]);

  const total = list.reduce((a, p) => a + p.balance, 0);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Khata" sub={kind === "customer" ? `To receive: ${money(Math.max(0, total))}` : `To pay: ${money(Math.max(0, -total))}`}
        right={<Btn kind="accent" icon={UserPlus} title="Add" onPress={() => setAdding(true)} style={{ marginRight: 4, minHeight: 44 }} />} />
      <FlatList
        data={list}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32, maxWidth: 640, width: "100%", alignSelf: "center" }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 4 }}>
            <Segmented value={kind} onChange={setKind} options={[{ value: "customer", label: "Customers" }, { value: "supplier", label: "Suppliers" }]} />
            <Field value={q} onChangeText={setQ} placeholder="Search name or phone" right={<Search size={20} color={C.muted} />} />
            <Row style={{ justifyContent: "space-between" }}>
              <T size={14} color={C.muted}>{list.length} {kind === "customer" ? "customers" : "suppliers"}</T>
              <Btn kind="ghost" title={sort === "balance" ? "Sorted: highest balance" : "Sorted: A to Z"} onPress={() => setSort(sort === "balance" ? "name" : "balance")} style={{ minHeight: 40, paddingHorizontal: 12 }} />
            </Row>
          </View>
        }
        renderItem={({ item: p }) => {
          const owe = kind === "customer" ? p.balance : -p.balance;
          return (
            <Card onPress={() => router.push(`/party/${p.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 64 }}>
              <View style={{ flex: 1 }}>
                <T w="sb" size={16} numberOfLines={1}>{p.name_en}</T>
                <T size={13} color={C.muted}>{p.phone || "No phone"}{p.last_at ? ` | last: ${dayLabel(p.last_at)}` : ""}</T>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <T w="b" size={16} color={owe > 0 ? C.red : C.green}>{money(Math.abs(owe))}</T>
                <T size={12} color={C.muted}>{owe > 0 ? (kind === "customer" ? "to receive" : "to pay") : owe < 0 ? "advance" : "clear"}</T>
              </View>
              <ChevronRight size={20} color={C.muted} />
            </Card>
          );
        }}
        ListEmptyComponent={<T color={C.muted} align="center" style={{ padding: 20 }}>No {kind}s found.</T>}
      />
      <AddParty visible={adding} kind={kind} onClose={() => setAdding(false)} />
    </View>
  );
}

function AddParty({ visible, kind, onClose }) {
  const { db, changed } = useDb();
  const [f, setF] = useState({ name_en: "", name_ur: "", phone: "", opening: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const word = kind === "customer" ? "customer" : "supplier";

  async function save() {
    if (!f.name_en.trim()) return setError("Write the name.");
    setBusy(true);
    try {
      const id = await addParty(db, { kind, ...f, opening: toInt(f.opening) });
      changed();
      setF({ name_en: "", name_ur: "", phone: "", opening: "" });
      setError("");
      onClose();
      router.push(`/party/${id}`);
    } catch (e) {
      setError(await explain(db, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={`Add ${word}`}
      footer={<Btn title={`Save ${word}`} busy={busy} onPress={save} size="lg" />}>
      <Field label="Name (English)" value={f.name_en} onChangeText={set("name_en")} placeholder="e.g. Rehman Kiryana Store" />
      <Field label="Name in Urdu (for Urdu memo)" value={f.name_ur} onChangeText={set("name_ur")} placeholder="مثلاً رحمان کریانہ اسٹور" />
      <Field label="Mobile number" value={f.phone} onChangeText={set("phone")} keyboard="phone-pad" placeholder="e.g. 0300-1234567" />
      <Field label={kind === "customer" ? "Old udhaar he owes you (Rs)" : "Old amount you owe him (Rs)"} value={f.opening} onChangeText={set("opening")}
        keyboard="numeric" placeholder="e.g. 5000, or leave empty" hint="From your old register, so the khata starts correct." />
      {error ? <Notice>{error}</Notice> : null}
    </Sheet>
  );
}
