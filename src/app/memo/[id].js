import { useEffect, useRef, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { MessageSquareText, Plus, Printer } from "../../components/icons";
import { Header } from "../../components/Header";
import { Memo, MEMO_WIDTH } from "../../components/Memo";
import { WhatsAppIcon } from "../../components/WhatsAppIcon";
import { Btn, Loading, Notice, Segmented, T } from "../../components/ui";
import { DEMO, useQuery } from "../../db/DbProvider";
import { getBill, getShop } from "../../db/queries";
import { billText } from "../../lib/messages";
import { openWhatsApp, renderMemo, shareImage } from "../../lib/share";
import { billNo, waNumber } from "../../lib/format";
import { C } from "../../theme";

export default function MemoScreen() {
  const { id } = useLocalSearchParams();
  const bill = useQuery((db) => getBill(db, Number(id)), [id]);
  const shop = useQuery(getShop);
  const [lang, setLang] = useState(null);
  const [pics, setPics] = useState({ print: null, wa: null });
  const [msg, setMsg] = useState("");
  const node = useRef(null);
  const [h, setH] = useState(0);
  const { width } = useWindowDimensions();

  const l = lang || bill?.lang || "en";
  const scale = Math.min(1, (Math.min(width, 640) - 32) / MEMO_WIDTH);

  // Make both pictures as soon as the memo is on screen, so sharing is instant.
  useEffect(() => {
    if (!bill || !shop) return;
    let alive = true;
    setPics({ print: null, wa: null });
    const t = setTimeout(async () => {
      try {
        const print = await renderMemo(node.current, 1);
        const wa = await renderMemo(node.current, 2);
        if (alive) setPics({ print, wa });
      } catch (e) {
        console.warn(e);
      }
    }, 150);
    return () => { alive = false; clearTimeout(t); };
  }, [bill, shop, l]);

  if (!bill || !shop) return <View style={{ flex: 1 }}><Header title="Memo" back /><Loading /></View>;

  const file = `Sohana-Bill-${billNo(bill.id)}-${l}.png`;
  const ready = !!pics.wa;
  const result = (r) => {
    if (r === "downloaded") setMsg("Picture saved to Downloads. On the phone this opens the share menu.");
    else setMsg("");
  };

  return (
    <View style={{ flex: 1 }}>
      <Header title={`Bill #${billNo(bill.id)}`} sub={bill.party_en} back />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40, maxWidth: 640, width: "100%", alignSelf: "center" }}>
        <Segmented value={l} onChange={setLang} options={[{ value: "en", label: "English" }, { value: "ur", label: "اردو" }]} />

        <View style={{ alignItems: "center" }}>
          <View style={{ width: MEMO_WIDTH * scale, height: h * scale, overflow: "hidden", borderWidth: 1, borderColor: C.line, backgroundColor: "#fff" }}>
            <View style={{ position: "absolute", top: 0, left: 0, transform: [{ scale }], transformOrigin: "top left" }}
              onLayout={(e) => setH(e.nativeEvent.layout.height)}>
              <Memo ref={node} bill={bill} shop={shop} lang={l} demo={DEMO} />
            </View>
          </View>
        </View>

        <Btn kind="wa" size="lg" disabled={!ready} onPress={async () => result(await shareImage(pics.wa, file, ""))}>
          <WhatsAppIcon size={22} color="#fff" />
          <T w="sb" size={18} color="#fff">{ready ? "Send memo on WhatsApp" : "Preparing picture..."}</T>
        </Btn>
        <Btn kind="primary" icon={Printer} title={ready ? "Print 58mm memo" : "Preparing picture..."} disabled={!ready}
          onPress={async () => result(await shareImage(pics.print, file, ""))} />
        <T size={13} color={C.muted}>
          Print: choose the RawBT app in the share menu, it prints on the MPT-II. In the full app this prints straight to the Bluetooth printer.
        </T>
        <Btn kind="ghost" icon={MessageSquareText} title="Send as WhatsApp text"
          onPress={() => openWhatsApp(billText(bill, shop, l), DEMO ? "" : waNumber(bill.party_phone))} />
        {msg ? <Notice kind="info">{msg}</Notice> : null}
        <Btn kind="accent" icon={Plus} title="New bill" onPress={() => router.dismissTo("/bill")} />
      </ScrollView>
    </View>
  );
}
