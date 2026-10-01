import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DbProvider } from "../db/DbProvider";
import { C, FONTS } from "../theme";
import { Splash } from "../components/Splash";

export default function RootLayout() {
  const [loaded] = useFonts(FONTS);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: C.paper }}>
        {loaded ? (
          <DbProvider fallback={<Splash />}>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }} />
          </DbProvider>
        ) : (
          <Splash />
        )}
      </View>
    </SafeAreaProvider>
  );
}
