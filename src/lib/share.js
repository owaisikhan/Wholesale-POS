import { Linking } from "react-native";

// Android build. Capturing the memo (react-native-view-shot) and Bluetooth
// printing to the MPT-II are added in the paid build; until then the
// Android app shares the bill as a WhatsApp text.
export async function renderMemo() {
  return null;
}

export async function shareImage() {
  return "none";
}

export function openWhatsApp(text, number) {
  return Linking.openURL(`https://wa.me/${number || ""}?text=${encodeURIComponent(text)}`);
}
