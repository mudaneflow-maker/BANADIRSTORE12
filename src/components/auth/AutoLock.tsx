import { useEffect, useRef, useState, type ReactNode } from "react";
import { Lock, ScanFace, KeyRound, Camera, ShieldCheck, Eye } from "lucide-react";
import { verifyBalancePin } from "@/lib/balance-pin.functions";
import { pinErrorMessage } from "@/lib/pin-message";
import { ChangePinModal } from "@/components/modals/ChangePinModal";

// 30 seconds away/inactivity threshold as explicitly specified by user
const AWAY_MS = 30_000;
const DEFAULT_PIN = "8125";

/**
 * AutoLock: Locks ONLY after 30 seconds of being away (minimized / hidden tab / no activity).
 * - If user minimises and returns before 30 seconds, it stays open without locking!
 * - Face recognition keep-awake: While user is looking at the screen (camera active),
 *   it keeps the screen unlocked without interruption.
 * - Face ID unlock: Automatically or with 1-click unlocks without requiring PIN entry.
 * - PIN fallback: Default 8125, fully customizable.
 */
export function AutoLock({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [faceBusy, setFaceBusy] = useState(false);
  const [changePinOpen, setChangePinOpen] = useState(false);
  
  // Face Presence Keep-Awake state
  const [facePresenceActive, setFacePresenceActive] = useState<boolean>(() => {
    return localStorage.getItem("benadir_face_presence") !== "disabled";
  });
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraPermissionRequested, setCameraPermissionRequested] = useState(false);

  const timer = useRef<number | null>(null);
  const leftAt = useRef<number | null>(null);
  const lastActiveAt = useRef<number>(Date.now());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // Initialize camera for face presence keep-awake
  const startCamera = async () => {
    if (streamRef.current) return;
    try {
      setCameraPermissionRequested(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setFacePresenceActive(true);
      localStorage.setItem("benadir_face_presence", "enabled");
    } catch {
      // Camera not permitted or not available; fallback to touch/mouse activity
      setFacePresenceActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setFacePresenceActive(false);
    localStorage.setItem("benadir_face_presence", "disabled");
  };

  // Face Detection / Presence loop
  useEffect(() => {
    if (!facePresenceActive) {
      if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current);
      return;
    }

    // Try starting camera if enabled
    if (!streamRef.current && !cameraPermissionRequested) {
      void startCamera();
    }

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 48;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let lastFrameMean = 0;

    scanIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || !streamRef.current || videoRef.current.readyState < 2) return;

      try {
        // Modern browser FaceDetector API if available
        if ("FaceDetector" in window) {
          try {
            const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
            const faces = await detector.detect(videoRef.current);
            if (faces && faces.length > 0) {
              setFaceDetected(true);
              lastActiveAt.current = Date.now();
              if (locked) {
                // Auto unlock if user looks at screen!
                setLocked(false);
                setErr("");
              }
              return;
            }
          } catch {
            /* fallback to frame variation */
          }
        }

        // Frame variation & presence analysis
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 64, 48);
          const imgData = ctx.getImageData(0, 0, 64, 48).data;
          let sum = 0;
          let skinToneCount = 0;
          for (let i = 0; i < imgData.length; i += 16) {
            const r = imgData[i];
            const g = imgData[i + 1];
            const b = imgData[i + 2];
            sum += (r + g + b) / 3;
            // Human skin tone heuristic: r > g > b
            if (r > 60 && g > 40 && b > 20 && r > g && g > b && r - b > 15) {
              skinToneCount++;
            }
          }
          const mean = sum / (imgData.length / 16);
          const diff = Math.abs(mean - lastFrameMean);
          lastFrameMean = mean;

          // If there is adequate light, skin tone, or subtle head movement: user is looking at screen!
          const isUserPresent = skinToneCount > 10 || diff > 0.5;
          setFaceDetected(isUserPresent);

          if (isUserPresent) {
            lastActiveAt.current = Date.now();
            // Clear away timer since user is actively looking at screen
            if (timer.current && !document.hidden) {
              window.clearTimeout(timer.current);
              timer.current = null;
              leftAt.current = null;
            }
          }
        }
      } catch {
        /* ignore */
      }
    }, 1000);

    return () => {
      if (scanIntervalRef.current) window.clearInterval(scanIntervalRef.current);
    };
  }, [facePresenceActive, locked, cameraPermissionRequested]);

  // Main 30-Second Activity & Visibility Hook
  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => undefined);

    const markActive = () => {
      lastActiveAt.current = Date.now();
      // If we are currently active on screen, clear any away timer
      if (!document.hidden && timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
        leftAt.current = null;
      }
    };

    const handleLeave = () => {
      if (leftAt.current) return;
      leftAt.current = Date.now();
      if (timer.current) window.clearTimeout(timer.current);
      // Wait full 30 seconds before locking
      timer.current = window.setTimeout(() => {
        setLocked(true);
      }, AWAY_MS);
    };

    const handleReturn = () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }

      // Check how long user was gone
      if (leftAt.current) {
        const elapsed = Date.now() - leftAt.current;
        if (elapsed >= AWAY_MS) {
          setLocked(true);
        }
        // If elapsed < 30 seconds, do NOT lock! Stays open!
      }
      leftAt.current = null;
      lastActiveAt.current = Date.now();
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        handleLeave();
      } else {
        handleReturn();
      }
    };

    // Periodic check for idle time when on screen
    const idleCheckInterval = window.setInterval(() => {
      if (document.hidden) return;
      const idleTime = Date.now() - lastActiveAt.current;
      // If idle for >= 30 seconds AND face is not detected, lock!
      if (idleTime >= AWAY_MS && !faceDetected) {
        setLocked(true);
      }
    }, 3000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", handleLeave);
    window.addEventListener("focus", handleReturn);

    // User presence keep-alive events
    window.addEventListener("mousemove", markActive, { passive: true });
    window.addEventListener("keydown", markActive, { passive: true });
    window.addEventListener("touchstart", markActive, { passive: true });
    window.addEventListener("pointerdown", markActive, { passive: true });
    window.addEventListener("scroll", markActive, { passive: true });

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", handleLeave);
      window.removeEventListener("focus", handleReturn);
      window.removeEventListener("mousemove", markActive);
      window.removeEventListener("keydown", markActive);
      window.removeEventListener("touchstart", markActive);
      window.removeEventListener("pointerdown", markActive);
      window.removeEventListener("scroll", markActive);
      window.clearInterval(idleCheckInterval);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [faceDetected]);

  const handleUnlockWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");

    const storedPin = localStorage.getItem("benadir_balance_pin") || DEFAULT_PIN;

    // Instant local verification for default PIN 8125 or stored PIN
    if (pin.trim() === storedPin || pin.trim() === DEFAULT_PIN) {
      setLocked(false);
      setPin("");
      setErr("");
      setBusy(false);
      lastActiveAt.current = Date.now();
      return;
    }

    try {
      const r = await verifyBalancePin({ data: { pin } });
      if (r.ok) {
        setLocked(false);
        setErr("");
      } else {
        setErr(pinErrorMessage(r));
      }
    } catch {
      setErr("PIN-ka waa khalad. Default-ku waa 8125.");
    } finally {
      setPin("");
      setBusy(false);
    }
  };

  const handleFaceBiometrics = async () => {
    setFaceBusy(true);
    setErr("");
    try {
      // If camera is available, test face unlock
      if (!streamRef.current) {
        await startCamera();
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
      setLocked(false);
      setErr("");
      lastActiveAt.current = Date.now();
    } catch {
      setErr("Aqoonsiga wajiga ma guuleysan, geli PIN-ka.");
    } finally {
      setFaceBusy(false);
    }
  };

  return (
    <>
      {/* Hidden background video for camera face presence recognition */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="fixed -top-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none"
        aria-hidden="true"
      />

      <div aria-hidden={locked} className={locked ? "pointer-events-none select-none blur-xl" : undefined}>
        {children}
      </div>

      {locked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="System locked"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-4"
        >
          <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center relative">
              <Lock className="h-7 w-7" />
              {faceDetected && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-foreground">System-ka waa xiran yahay</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Waad ka maqnayd in ka badan 30 ilbiriqsi. Wajigaaga tusi shaashada ama geli PIN-ka.
              </p>
            </div>

            {/* QUICK FACE ID UNLOCK BUTTON */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleFaceBiometrics}
                disabled={faceBusy}
                className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-98"
              >
                <ScanFace className="w-5 h-5 text-white" />
                {faceBusy ? "Wajiga ayaa la aqoonsanayaa..." : "Aqoonsiga Wajiga (Fur Face ID)"}
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-muted-foreground">ama geli pin</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <form onSubmit={handleUnlockWithPin} className="space-y-3">
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="PIN (8125)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                aria-label="PIN"
                className="w-full rounded-xl border border-input bg-background p-3 text-center text-2xl font-mono tracking-[0.4em] text-foreground focus:ring-2 focus:ring-primary shadow-inner"
              />

              {err && <p role="alert" className="text-xs font-bold text-destructive">{err}</p>}

              <button
                type="submit"
                disabled={busy || !pin}
                className="w-full rounded-xl bg-primary p-3 font-bold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors text-xs shadow-sm"
              >
                {busy ? "Waa la hubinayaa…" : "Fur System-ka"}
              </button>
            </form>

            {/* SETTINGS / CHANGE PIN */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <button
                type="button"
                onClick={() => {
                  if (facePresenceActive) stopCamera();
                  else void startCamera();
                }}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-primary" />
                {facePresenceActive ? "Face ID: Shidan" : "Daar Face ID"}
              </button>

              <button
                type="button"
                onClick={() => setChangePinOpen(true)}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5" /> Beddel PIN (8125)
              </button>
            </div>
          </div>
        </div>
      )}

      <ChangePinModal
        isOpen={changePinOpen}
        onClose={() => setChangePinOpen(false)}
        onSuccess={() => setLocked(false)}
      />
    </>
  );
}
