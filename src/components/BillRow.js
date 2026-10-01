import { View } from "react-native";
import { router } from "expo-router";
import { ChevronRight } from "./icons";
import { Card, T } from "./ui";
import { C } from "../theme";
import { billNo, dayLabel, money, timeText } from "../lib/format";

// One bill in a list: who, when, total and how much was paid. Tap opens the memo.
export function BillRow({ bill: b, first, showDay = true }) {
  const paid = b.received >= b.total;
  return (
    <Card onPress={() => router.push(`/memo/${b.id}`)}
      style={{ borderWidth: 0, borderRadius: 0, borderTopWidth: first ? 0 : 1, borderColor: C.line, flexDirection: "row", alignItems: "center", gap: 10, minHeight: 64 }}>
      <View style={{ flex: 1 }}>
        <T w="sb" size={16} numberOfLines={1}>{b.name_en}</T>
        <T size={13} color={C.muted}>#{billNo(b.id)} | {showDay ? `${dayLabel(b.created_at)} ` : ""}{timeText(b.created_at)}</T>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <T w="b" size={16}>{money(b.total)}</T>
        <T size={13} color={paid ? C.green : C.red}>
          {paid ? "Paid" : b.received ? `Paid ${money(b.received)}` : "Udhaar"}
        </T>
      </View>
      <ChevronRight size={20} color={C.muted} />
    </Card>
  );
}
