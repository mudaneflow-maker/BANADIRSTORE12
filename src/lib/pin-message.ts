import type { PinResult } from "@/lib/balance-pin.functions";

/** Somali message for a failed PIN check. */
export function pinErrorMessage(r: PinResult): string {
  if (r.ok) return "";
  if (r.error === "wrong") return `PIN khaldan. ${r.remaining} isku-day ayaa kuu haray.`;
  if (r.error === "locked") {
    const t = new Date(r.lockedUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `Isku-dayo badan oo khaldan. PIN-ka waa la xiray ilaa ${t}.`;
  }
  if (r.error === "forbidden") return "Akoonkan uma oggola.";
  return "Lama xaqiijin karo PIN-ka hadda.";
}
