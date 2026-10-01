import { useState } from "react";
import { FlatList, View } from "react-native";
import { ArrowDownLeft, ArrowUpRight } from "../../components/icons";
import { Header } from "../../components/Header";
import { Btn, Card, Chip, Field, Notice, Row, Segmented, Sheet, T } from "../../components/ui";
import { useDb, useQuery } from "../../db/DbProvider";
import { cashEntries, dashboard } from "../../db/queries";
import { addCash } from "../../db/actions";
import { explain } from "../../lib/refusals";
import { dayLabel, money, timeText, toInt } from "../../lib/format";
import { C } from "../../theme";

const CATS = {
  in: ["Owner added cash", "Other income"],
  out: ["Loading / Rickshaw", "Shop rent", "Electricity bill", "Salary", "Tea / Food", "Owner (ghar kharch)", "Other"],
};

export default function Cash() {
  const [range, setRange] = useState("today");
  const [dir, setDir] = useState(null);
  const d = useQuery(dashboard);
  const rows = useQuery((db) => cashEntries(db, range === "today"), [range]);

  return (
    <View style={{ flex: 1 }}>
      <Header title="Cash" sub="Cash in hand and daily kharch" />
      <FlatList
        data={rows || []}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 32, maxWidth: 640, width: "100%", alignSelf: "center" }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 6 }}>
            <Card style={{ alignItems: "center", paddingVertical: 18, gap: 2 }}>
              <T size={14} w="sb" color={C.muted}>Cash in hand</T>
              <T w="b" size={30}>{d ? money(d.inHand) : "..."}</T>
              {d ? <T size={14} color={C.muted}>Today: in {money(d.cashToday.cin)} | out {money(d.cashToday.cout)}</T> : null}
            </Card>
            <Row gap={10}>
              <Btn style={{ flex: 1 }} icon={ArrowDownLeft} title="Cash In" onPress={() => setDir("in")} />
              <Btn style={{ flex: 1 }} kind="danger" icon={ArrowUpRight} title="Cash Out" onPress={() => setDir("out")} />
            </Row>
            <T size={13} color={C.muted}>Bills, recoveries and supplier payments are added here by themselves.</T>
            <Segmented value={range} onChange={setRange} options={[{ value: "today", label: "Today" }, { value: "all", label: "All" }]} />
          </View>
        }
        renderItem={({ item: r }) => (
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <T w="sb" size={15}>{r.category}{r.party_en ? `: ${r.party_en}` : ""}</T>
              <T size={13} color={C.muted}>{dayLabel(r.created_at)} {timeText(r.created_at)}{r.note ? ` | ${r.note}` : ""}</T>
            </View>
            <T w="b" size={16} color={r.dir === "in" ? C.green : C.red}>{r.dir === "in" ? "+ " : "- "}{money(r.amount)}</T>
          </Card>
        )}
        ListEmptyComponent={<T color={C.muted} align="center" style={{ padding: 20 }}>No cash entries {range === "today" ? "today" : "yet"}.</T>}
      />
      <CashSheet dir={dir} onClose={() => setDir(null)} />
    </View>
  );
}

function CashSheet({ dir, onClose }) {
  const { db, changed } = useDb();
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (toInt(amount) <= 0) return setError("Write the amount.");
    if (!cat) return setError("Choose what it is for.");
    setBusy(true);
    try {
      await addCash(db, { dir, amount: toInt(amount), category: cat, note: note.trim() });
      changed();
      setAmount(""); setCat(""); setNote(""); setError("");
      onClose();
    } catch (e) {
      setError(await explain(db, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={!!dir} onClose={onClose} title={dir === "in" ? "Cash In" : "Cash Out (kharch)"}
      footer={<Btn title="Save" size="lg" busy={busy} onPress={save} />}>
      <Field label="Amount (Rs)" value={amount} onChangeText={setAmount} keyboard="numeric" placeholder="e.g. 500" autoFocus />
      <T w="sb" size={14} color={C.inkSoft}>For</T>
      <Row gap={8} style={{ flexWrap: "wrap" }}>
        {(CATS[dir] || []).map((c) => <Chip key={c} label={c} on={cat === c} onPress={() => setCat(c)} />)}
      </Row>
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Rohri delivery" />
      <T size={13} color={C.muted}>For a customer's payment use Khata, Receive payment, so his udhaar goes down too.</T>
      {error ? <Notice>{error}</Notice> : null}
    </Sheet>
  );
}
