import { useState } from "react";
import { FlatList, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "../../components/icons";
import { Header } from "../../components/Header";
import { WhatsAppIcon } from "../../components/WhatsAppIcon";
import { Btn, Card, Field, Loading, Notice, Row, Sheet, T } from "../../components/ui";
import { DEMO, useDb, useQuery } from "../../db/DbProvider";
import { getParty, getShop, partyLedger } from "../../db/queries";
import { recordPayment } from "../../db/actions";
import { explain } from "../../lib/refusals";
import { KIND, statementText } from "../../lib/messages";
import { openWhatsApp } from "../../lib/share";
import { billNo, dayLabel, money, timeText, toInt, waNumber } from "../../lib/format";
import { C } from "../../theme";

export default function PartyScreen() {
  const { id } = useLocalSearchParams();
  const pid = Number(id);
  const party = useQuery((db) => getParty(db, pid), [pid]);
  const entries = useQuery((db) => partyLedger(db, pid), [pid]);
  const shop = useQuery(getShop);
  const [paying, setPaying] = useState(false);

  if (!party || !entries) return <View style={{ flex: 1 }}><Header title="Khata" back /><Loading /></View>;

  const customer = party.kind === "customer";
  const owe = customer ? party.balance : -party.balance;

  return (
    <View style={{ flex: 1 }}>
      <Header title={party.name_en} sub={party.phone || (customer ? "Customer" : "Supplier")} back />
      <FlatList
        data={entries}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 32, maxWidth: 640, width: "100%", alignSelf: "center" }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 6 }}>
            <Card style={{ alignItems: "center", gap: 2, paddingVertical: 18 }}>
              <T size={14} w="sb" color={C.muted}>{owe > 0 ? (customer ? "He owes you" : "You owe him") : owe < 0 ? "Advance" : "Khata clear"}</T>
              <T w="b" size={30} color={owe > 0 ? C.red : C.green}>{money(Math.abs(owe))}</T>
            </Card>
            <Row gap={10}>
              <Btn style={{ flex: 1 }} kind="primary" icon={customer ? ArrowDownLeft : ArrowUpRight}
                title={customer ? "Receive" : "Pay supplier"} onPress={() => setPaying(true)} />
              {customer ? <Btn style={{ flex: 1 }} kind="accent" icon={ReceiptText} title="New bill" onPress={() => router.dismissTo({ pathname: "/bill", params: { party: party.id } })} /> : null}
            </Row>
            <Btn kind="wa" onPress={() => openWhatsApp(statementText(party, entries, shop || {}), DEMO ? "" : waNumber(party.phone))}>
              <WhatsAppIcon size={20} color="#fff" />
              <T w="sb" size={16} color="#fff">Send khata on WhatsApp</T>
            </Btn>
            <T w="b" size={17} style={{ marginTop: 6 }}>History</T>
          </View>
        }
        renderItem={({ item: e }) => {
          const open = e.bill_id && e.kind === "bill";
          const bal = customer ? e.running : -e.running;
          return (
            <Card onPress={open ? () => router.push(`/memo/${e.bill_id}`) : undefined} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <T w="sb" size={15}>{KIND[e.kind]}{e.bill_id && e.kind === "bill" ? ` #${billNo(e.bill_id)}` : ""}{e.note && e.kind !== "opening" ? ` (${e.note})` : ""}</T>
                <T size={13} color={C.muted}>{dayLabel(e.created_at)} {timeText(e.created_at)}</T>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <T w="b" size={15} color={e.debit ? (customer ? C.red : C.green) : (customer ? C.green : C.red)}>
                  {e.debit ? "+ " : "- "}{money(e.debit || e.credit)}
                </T>
                <T size={12} color={C.muted}>Balance {money(bal)}</T>
              </View>
            </Card>
          );
        }}
      />
      <PaySheet visible={paying} party={party} onClose={() => setPaying(false)} />
    </View>
  );
}

function PaySheet({ visible, party, onClose }) {
  const { db, changed } = useDb();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const customer = party.kind === "customer";
  const owe = customer ? party.balance : -party.balance;

  async function save() {
    const a = toInt(amount);
    if (a <= 0) return setError("Write the amount.");
    setBusy(true);
    try {
      await recordPayment(db, { partyId: party.id, amount: a, note: note.trim() });
      changed();
      setAmount(""); setNote(""); setError("");
      onClose();
    } catch (e) {
      setError(await explain(db, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={customer ? "Receive payment" : "Pay supplier"}
      footer={<Btn title="Save" size="lg" busy={busy} onPress={save} />}>
      <T size={15} color={C.inkSoft}>{customer ? "Current udhaar" : "You owe"}: <T w="b" size={15}>{money(Math.max(0, owe))}</T></T>
      <Field label="Amount (Rs)" value={amount} onChangeText={setAmount} keyboard="numeric" placeholder="e.g. 5000" autoFocus />
      {owe > 0 ? <Btn kind="ghost" title={`Full amount ${money(owe)}`} onPress={() => setAmount(String(owe))} /> : null}
      <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Easypaisa, cheque" />
      <T size={13} color={C.muted}>{customer ? "Adds to cash in hand and reduces his udhaar." : "Taken from cash in hand and reduces what you owe."}</T>
      {error ? <Notice>{error}</Notice> : null}
    </Sheet>
  );
}
