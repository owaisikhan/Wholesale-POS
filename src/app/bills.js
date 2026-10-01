import { useMemo, useState } from "react";
import { SectionList, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Search } from "../components/icons";
import { Header } from "../components/Header";
import { BillRow } from "../components/BillRow";
import { Btn, Card, Field, Loading, Row, Segmented, T } from "../components/ui";
import { useQuery } from "../db/DbProvider";
import { billTotals, listBills } from "../db/queries";
import { dayLabel, money } from "../lib/format";
import { C } from "../theme";

const PAGE = 30;

export default function AllBills() {
  const params = useLocalSearchParams();
  const [range, setRange] = useState(params.range === "today" ? "today" : "all");
  const [q, setQ] = useState("");
  const [pages, setPages] = useState(1);

  const filter = { range, q };
  const rows = useQuery((db) => listBills(db, { ...filter, limit: PAGE * pages }), [range, q, pages]);
  const sum = useQuery((db) => billTotals(db, filter), [range, q]);

  // Group by day so a long list still reads like the paper register.
  const sections = useMemo(() => {
    const out = [];
    for (const b of rows || []) {
      const day = b.created_at.slice(0, 10);
      const last = out[out.length - 1];
      if (last && last.day === day) last.data.push(b);
      else out.push({ day, title: dayLabel(b.created_at), data: [b] });
    }
    return out;
  }, [rows]);

  const change = (fn) => (v) => { fn(v); setPages(1); };
  const more = sum && rows && rows.length < sum.n;

  return (
    <View style={{ flex: 1 }}>
      <Header title="All bills" sub={sum ? `${sum.n} bill${sum.n === 1 ? "" : "s"} | ${money(sum.total)}` : ""} back />
      {!rows || !sum ? <Loading /> : (
        <SectionList
          sections={sections}
          keyExtractor={(b) => String(b.id)}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: 32, maxWidth: 640, width: "100%", alignSelf: "center" }}
          ListHeaderComponent={
            <View style={{ gap: 10, marginBottom: 6 }}>
              <Segmented value={range} onChange={change(setRange)}
                options={[{ value: "today", label: "Today" }, { value: "week", label: "7 days" }, { value: "all", label: "All" }]} />
              <Field value={q} onChangeText={change(setQ)} placeholder="Search customer or bill number" right={<Search size={20} color={C.muted} />} />
              <Card style={{ flexDirection: "row", gap: 8 }}>
                <Total label="Sale" value={money(sum.total)} />
                <Total label="Received" value={money(sum.received)} />
                <Total label="Udhaar" value={money(sum.total - sum.received)} color={sum.total > sum.received ? C.red : C.ink} />
              </Card>
            </View>
          }
          renderSectionHeader={({ section }) => (
            <Row style={{ justifyContent: "space-between", marginTop: 12, marginBottom: 6 }}>
              <T w="b" size={15}>{section.title}</T>
              <T size={13} color={C.muted}>{money(section.data.reduce((a, b) => a + b.total, 0))}</T>
            </Row>
          )}
          renderItem={({ item, index, section }) => (
            <View style={[
              { backgroundColor: C.card, borderLeftWidth: 1, borderRightWidth: 1, borderColor: C.line, overflow: "hidden" },
              index === 0 && { borderTopWidth: 1, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
              index === section.data.length - 1 && { borderBottomWidth: 1, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
            ]}>
              <BillRow bill={item} first={index === 0} showDay={false} />
            </View>
          )}
          ListEmptyComponent={
            <T color={C.muted} align="center" style={{ padding: 24 }}>
              {q ? `No bill found for "${q}".` : range === "today" ? "No bills today yet." : "No bills yet."}
            </T>
          }
          ListFooterComponent={more ? (
            <Btn kind="ghost" title={`Show more (${sum.n - rows.length} left)`} onPress={() => setPages((p) => p + 1)} style={{ marginTop: 14 }} />
          ) : null}
        />
      )}
    </View>
  );
}

function Total({ label, value, color = C.ink }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <T size={12} w="sb" color={C.muted}>{label}</T>
      <T w="b" size={15} color={color}>{value}</T>
    </View>
  );
}
