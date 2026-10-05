import { useEffect } from "react";

// Short synthesized UI sounds (no audio files). Mute via localStorage "benadir_sound_off" = "1".
let ctx: AudioContext | null = null;
function tone(freq: number, dur: number, type: OscillatorType, gain = 0.04, slide?: number) {
  try {
    if (localStorage.getItem("benadir_sound_off") === "1") return;
    ctx ??= new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch {
    /* audio unavailable */
  }
}

export const uiSound = {
  click: () => tone(1200, 0.05, "triangle"),
  nav: () => tone(700, 0.08, "sine", 0.05, 1000),
  submit: () => tone(520, 0.14, "sine", 0.05, 880),
  danger: () => tone(300, 0.15, "sawtooth", 0.03, 180),
};

export function UiSounds() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest(
        "button, a, [role=button], [role=tab], [role=menuitem], select, input[type=checkbox]",
      ) as HTMLElement | null;
      if (!el || (el as HTMLButtonElement).disabled) return;
      const txt = (el.textContent || "").toLowerCase();
      if (el.matches("a, [role=tab]")) uiSound.nav();
      else if ((el as HTMLButtonElement).type === "submit") uiSound.submit();
      else if (/delete|tirtir|remove/.test(txt)) uiSound.danger();
      else uiSound.click();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
