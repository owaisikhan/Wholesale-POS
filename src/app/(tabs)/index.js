import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { AlertTriangle, ChevronRight, Plus } from "../../components/icons";
import { Header } from "../../components/Header";
import { Btn, Card, Loading, Row, T } from "../../components/ui";
import { BillRow } from "../../components/BillRow";
import { useQuery } from "../../db/DbProvider";
import { dashboard, getShop, lowStock, recentBills } from "../../db/queries";
import { C } from "../../theme";
import { money, qtyText } from "../../lib/format";

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
            <Stat label="Today's sale" value={money(d.sale.total)} sub={`${d.sale.n} bill${d.sale.n === 1 ? "" : "s"}, see all`} onPress={() => router.push({ pathname: "/bills", params: { range: "today" } })} />
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
            <Btn kind="ghost" title="See all bills" icon={ChevronRight} onPress={() => router.push("/bills")} style={{ minHeight: 44, paddingHorizontal: 12, flexDirection: "row-reverse" }} />
          </Row>
          <Card style={{ padding: 0, overflow: "hidden" }}>
            {bills?.map((b, i) => <BillRow key={b.id} bill={b} first={i === 0} />)}
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
