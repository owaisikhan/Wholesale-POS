import { toBlob } from "html-to-image";
import * as Font from "expo-font";
import { URDU } from "../theme";

// Web (the demo): the memo View is a DOM node, so html-to-image draws it to PNG.
// The image is made ahead of the tap, because Android Chrome only lets
// navigator.share run within a few seconds of the user's tap.
export async function renderMemo(node, scale) {
  if (!node) return null;
  // The Urdu font loads after the first screen; the picture must not use a fallback.
  await Font.loadAsync(URDU).catch(() => {});
  if (document.fonts?.ready) await document.fonts.ready;
  return toBlob(node, { pixelRatio: scale, backgroundColor: "#ffffff", cacheBust: false });
}

export async function shareImage(blob, fileName, text) {
  if (!blob) return "none";
  const file = new File([blob], fileName, { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  // Laptop browsers cannot share files: download the picture instead.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}

export function openWhatsApp(text, number) {
  const url = `https://wa.me/${number || ""}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener");
}
