import { ActivityIndicator, Text, View } from "react-native";
import { C } from "../theme";

// Shown while fonts load and the demo shop is filled in (about a second).
export function Splash() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.navy, gap: 14 }}>
      <Text style={{ color: "#fff", fontSize: 26, fontWeight: "700", letterSpacing: 1 }}>SOHANA TRADERS</Text>
      <ActivityIndicator color={C.turmeric} size="large" />
      <Text style={{ color: "#D6DBE6", fontSize: 15 }}>Opening your shop...</Text>
    </View>
  );
}
