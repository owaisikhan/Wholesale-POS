import { Tabs } from "expo-router";
import { BookUser, Home, Package, ReceiptText, Wallet } from "../../components/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F } from "../../theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const icon = (Icon) => ({ color, focused }) => <Icon size={24} color={color} strokeWidth={focused ? 2.4 : 2} />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.navy,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: { height: 70 + insets.bottom, paddingTop: 6, paddingBottom: 10 + insets.bottom, borderTopColor: C.line, backgroundColor: C.card },
        tabBarLabelStyle: { fontFamily: F.sb, fontSize: 12 },
        sceneStyle: { backgroundColor: C.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon(Home) }} />
      <Tabs.Screen name="bill" options={{ title: "New Bill", tabBarIcon: icon(ReceiptText) }} />
      <Tabs.Screen name="khata" options={{ title: "Khata", tabBarIcon: icon(BookUser) }} />
      <Tabs.Screen name="stock" options={{ title: "Stock", tabBarIcon: icon(Package) }} />
      <Tabs.Screen name="cash" options={{ title: "Cash", tabBarIcon: icon(Wallet) }} />
    </Tabs>
  );
}
