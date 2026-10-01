import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from "react-native";
import { X } from "../icons";
import { C, F, R } from "../../theme";
import { hasUrdu } from "../../lib/format";

// Text that picks the Urdu font by itself when the string is in Urdu script.
export function T({ children, w = "r", size = 16, color = C.ink, style, align, numberOfLines, ...rest }) {
  const s = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : "";
  const urdu = hasUrdu(s);
  const family = urdu ? (w === "r" ? F.ur : F.urB) : F[w] || F.r;
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: family, fontSize: urdu ? size - 1 : size, color, lineHeight: Math.round(size * (urdu ? 2 : 1.35)) },
        urdu && { writingDirection: "rtl" },
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function Btn({ title, onPress, kind = "primary", icon: Icon, disabled, busy, style, size = "md", children }) {
  const k = KINDS[kind];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.btn,
        size === "lg" && { minHeight: 56 },
        { backgroundColor: pressed ? k.press : k.bg, borderColor: k.border },
        (disabled || busy) && { opacity: 0.5 },
        style,
      ]}
    >
      {Icon ? <Icon size={size === "lg" ? 22 : 19} color={k.fg} strokeWidth={2.2} /> : null}
      {children || <T w="sb" size={size === "lg" ? 18 : 16} color={k.fg}>{busy ? "Saving..." : title}</T>}
    </Pressable>
  );
}

const KINDS = {
  primary: { bg: C.navy, press: C.navyPress, fg: "#fff", border: C.navy },
  accent: { bg: C.turmeric, press: "#CF9113", fg: C.ink, border: C.turmeric },
  ghost: { bg: C.card, press: C.paper, fg: C.ink, border: C.lineStrong },
  danger: { bg: C.card, press: C.redSoft, fg: C.red, border: C.red },
  wa: { bg: "#1E8E4E", press: "#18753F", fg: "#fff", border: "#1E8E4E" },
};

export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { backgroundColor: C.paper }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
}

export function Field({ label, hint, value, onChangeText, placeholder, keyboard = "default", autoFocus, style, right, multiline }) {
  const [focus, setFocus] = useState(false);
  const urdu = hasUrdu(value) || hasUrdu(placeholder);
  return (
    <View style={[{ gap: 6 }, style]}>
      {label ? <T w="sb" size={14} color={C.inkSoft}>{label}</T> : null}
      <View style={[s.input, focus && { borderColor: C.navy, borderWidth: 2 }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.placeholder}
          keyboardType={keyboard}
          inputMode={keyboard === "numeric" ? "numeric" : keyboard === "phone-pad" ? "tel" : undefined}
          autoFocus={autoFocus}
          multiline={multiline}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={[
            s.inputText,
            urdu && { fontFamily: value ? F.ur : F.ur, writingDirection: "rtl", textAlign: "right", fontSize: 16, lineHeight: 34 },
            Platform.OS === "web" && { outlineStyle: "none" },
          ]}
        />
        {right}
      </View>
      {hint ? <T size={13} color={C.muted}>{hint}</T> : null}
    </View>
  );
}

export function Sheet({ visible, onClose, title, children, footer }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={s.sheet}>
          <View style={s.sheetHead}>
            <T w="b" size={19} style={{ flex: 1 }}>{title}</T>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={s.iconBtn}>
              <X size={22} color={C.ink} />
            </Pressable>
          </View>
          <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? <View style={s.sheetFoot}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Segmented({ options, value, onChange, style }) {
  return (
    <View style={[s.seg, style]} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[s.segBtn, on && { backgroundColor: C.navy }]}
          >
            <T w="sb" size={15} color={on ? "#fff" : C.ink}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chip({ label, on, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }}
      style={[s.chip, on && { backgroundColor: C.navy, borderColor: C.navy }]}>
      <T w="sb" size={14} color={on ? "#fff" : C.ink}>{label}</T>
    </Pressable>
  );
}

export function Row({ children, style, gap = 8 }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

export function Notice({ kind = "error", children }) {
  const k = kind === "error" ? { bg: C.redSoft, fg: C.red } : kind === "ok" ? { bg: C.greenSoft, fg: C.green } : { bg: C.turmericSoft, fg: C.ink };
  return (
    <View style={{ backgroundColor: k.bg, borderRadius: R.sm, padding: 12, borderLeftWidth: 4, borderLeftColor: k.fg }}>
      <T size={15} color={k.fg} w="sb">{children}</T>
    </View>
  );
}

export function Empty({ title, sub }) {
  return (
    <View style={{ padding: 28, alignItems: "center", gap: 6 }}>
      <T w="sb" size={16} align="center">{title}</T>
      {sub ? <T size={14} color={C.muted} align="center">{sub}</T> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 24 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: 64, borderRadius: R.md, backgroundColor: "#ECE7DC", marginBottom: 10 }} />
      ))}
    </View>
  );
}

export const s = StyleSheet.create({
  btn: {
    minHeight: 48, paddingHorizontal: 16, borderRadius: R.md, borderWidth: 1.5,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  card: { backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line, padding: 14 },
  input: {
    minHeight: 50, borderWidth: 1.5, borderColor: C.lineStrong, borderRadius: R.sm, backgroundColor: C.card,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 12,
  },
  inputText: { flex: 1, fontFamily: F.condM, fontSize: 18, color: C.ink, paddingVertical: 10, minWidth: 0 },
  backdrop: { flex: 1, backgroundColor: "rgba(23,35,59,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: C.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "92%",
    width: "100%", maxWidth: 560, alignSelf: "center",
  },
  sheetHead: { flexDirection: "row", alignItems: "center", paddingLeft: 16, paddingRight: 6, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  sheetFoot: { padding: 16, borderTopWidth: 1, borderTopColor: C.line, gap: 10 },
  iconBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  seg: { flexDirection: "row", backgroundColor: C.card, borderRadius: R.md, borderWidth: 1, borderColor: C.line, padding: 4, gap: 4 },
  segBtn: { flex: 1, minHeight: 44, borderRadius: R.sm, alignItems: "center", justifyContent: "center" },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: C.lineStrong, backgroundColor: C.card, justifyContent: "center" },
});
