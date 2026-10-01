import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { AlertTriangle, ChevronRight, Plus } from "../../components/icons";
import { Header } from "../../components/Header";
import { Btn, Card, Loading, Row, T } from "../../components/ui";
import { useQuery } from "../../db/DbProvider";
import { dashboard, getShop, lowStock, recentBills } from "../../db/queries";
import { C } from "../../theme";
import { billNo, dayLabel, money, qtyText, timeText } from "../../lib/format";

export default function Home() {
  const shop = useQuery(getShop);
  const d = useQuery(dashboard);
  const low = useQuery(lowStock);
  const bills = useQuery(recentBills);

  return (
    <View style={{ flex: 1 }}>
      <Header title={shop?.shop_en || "Sohana Traders"} sub={shop ? `${shop.city_en} | ${shop.owner_en}` : ""} />
      {!d ? <Loading /> : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32, maxWidth: 640, width: "100%", alignSelf: "center" }}>
          <Btn title="New Bill" icon={Plus} kind="accent" size="lg" onPress={() => router.navigate("/bill")} />

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Stat label="Today's sale" value={money(d.sale.total)} sub={`${d.sale.n} bill${d.sale.n === 1 ? "" : "s"}`} />
            <Stat label="Cash in hand" value={money(d.inHand)} sub={`In ${money(d.cashToday.cin)} | Out ${money(d.cashToday.cout)}`} onPress={() => router.navigate("/cash")} />
            <Stat label="Udhaar (to receive)" value={money(d.udhaar.total)} sub={`${d.udhaar.n} customers`} onPress={() => router.navigate("/khata")} />
            <Stat label="Recovery today" value={money(d.cashToday.recovery)} sub={`Suppliers owed ${money(d.payable.total)}`} />
          </View>

          {low?.length ? (
            <Card style={{ borderColor: C.turmeric, borderWidth: 2, backgroundColor: C.turmericSoft, gap: 8 }} onPress={() => router.navigate("/stock")}>
              <Row>
                <AlertTriangle size={20} color={C.ink} />
                <T w="b" size={16}>Low stock: {low.length} item{low.length === 1 ? "" : "s"}</T>
              </Row>
              {low.map((i) => (
                <Row key={i.id} style={{ justifyContent: "space-between" }}>
                  <T size={15} style={{ flex: 1 }}>{i.name_en}</T>
                  <T w="sb" size={15}>{qtyText(i.stock)} {i.unit_en} left</T>
                </Row>
              ))}
            </Card>
          ) : null}

          <Row style={{ justifyContent: "space-between", marginTop: 4 }}>
            <T w="b" size={17}>Recent bills</T>
          </Row>
          <Card style={{ padding: 0 }}>
            {bills?.map((b, i) => (
              <Card key={b.id} onPress={() => router.push(`/memo/${b.id}`)}
                style={{ borderWidth: 0, borderRadius: 0, borderTopWidth: i ? 1 : 0, borderColor: C.line, flexDirection: "row", alignItems: "center", gap: 10, minHeight: 64 }}>
                <View style={{ flex: 1 }}>
                  <T w="sb" size={16} numberOfLines={1}>{b.name_en}</T>
                  <T size={13} color={C.muted}>#{billNo(b.id)} | {dayLabel(b.created_at)} {timeText(b.created_at)}</T>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <T w="b" size={16}>{money(b.total)}</T>
                  <T size={13} color={b.received >= b.total ? C.green : C.red}>
                    {b.received >= b.total ? "Paid" : b.received ? `Paid ${money(b.received)}` : "Udhaar"}
                  </T>
                </View>
                <ChevronRight size={20} color={C.muted} />
              </Card>
            ))}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value, sub, onPress }) {
  return (
    <Card onPress={onPress} style={{ flexGrow: 1, flexBasis: "45%", minWidth: 150, gap: 2 }}>
      <T size={13} w="sb" color={C.muted}>{label}</T>
      <T w="b" size={20}>{value}</T>
      {sub ? <T size={12} color={C.muted}>{sub}</T> : null}
    </Card>
  );
}
