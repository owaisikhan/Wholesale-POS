import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft } from "./icons";
import { C } from "../theme";
import { T } from "./ui";
import { DEMO } from "../db/DbProvider";

export function Header({ title, sub, back, right }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: C.navy, paddingTop: insets.top }}>
      {DEMO ? (
        <View style={{ backgroundColor: C.turmeric, paddingVertical: 4, paddingHorizontal: 16 }}>
          <T size={13} w="sb" align="center">Demo: sample data, resets when you refresh</T>
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 60, paddingHorizontal: back ? 4 : 16, gap: 4 }}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeft size={24} color="#fff" />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, paddingVertical: 6 }}>
          <T w="b" size={20} color="#fff" numberOfLines={1}>{title}</T>
          {sub ? <T size={13} color="#C9D0DE" numberOfLines={1}>{sub}</T> : null}
        </View>
        {right}
      </View>
    </View>
  );
}
