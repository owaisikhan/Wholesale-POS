import { useEffect } from "react";
import { Platform, View } from "react-native";
import { Stack } from "expo-router";
import * as Font from "expo-font";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DbProvider } from "../db/DbProvider";
import { C, LATIN, URDU } from "../theme";
import { Splash } from "../components/Splash";

// On the phone app every font is local, so wait for all of them. On the web
// demo only the small Latin set blocks the first screen; Urdu text shows in a
// fallback font for a moment and the memo picture waits for the real one.
const BLOCKING = Platform.OS === "web" ? LATIN : { ...LATIN, ...URDU };

export default function RootLayout() {
  const [loaded] = useFonts(BLOCKING);
  useEffect(() => {
    if (Platform.OS === "web") Font.loadAsync(URDU).catch((e) => console.warn(e));
  }, []);
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: C.paper }}>
        {loaded ? (
          <DbProvider fallback={<Splash />}>
            <BootDone />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }} />
          </DbProvider>
        ) : (
          <Splash />
        )}
      </View>
    </SafeAreaProvider>
  );
}

// Removes the plain-HTML loading screen (scripts/add-meta.mjs) once the app is ready.
function BootDone() {
  useEffect(() => {
    if (Platform.OS === "web") document.getElementById("boot")?.remove();
  }, []);
  return null;
}
