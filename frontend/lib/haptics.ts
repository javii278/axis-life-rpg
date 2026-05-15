// Uses Capacitor Haptics on native Android, falls back to navigator.vibrate on web.
let _haptics: typeof import("@capacitor/haptics").Haptics | null = null;

async function getHaptics() {
  if (_haptics !== null) return _haptics;
  try {
    const { Haptics } = await import("@capacitor/haptics");
    _haptics = Haptics;
  } catch {
    _haptics = null;
  }
  return _haptics;
}

export async function hapticImpact(style: "Heavy" | "Medium" | "Light" = "Medium") {
  const h = await getHaptics();
  if (h) {
    try {
      const { ImpactStyle } = await import("@capacitor/haptics");
      await h.impact({ style: ImpactStyle[style] });
      return;
    } catch {}
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    const ms = style === "Heavy" ? [40, 30, 80] : style === "Medium" ? [30] : [20];
    navigator.vibrate(ms);
  }
}

export async function hapticNotification(type: "Success" | "Warning" | "Error" = "Success") {
  const h = await getHaptics();
  if (h) {
    try {
      const { NotificationType } = await import("@capacitor/haptics");
      await h.notification({ type: NotificationType[type] });
      return;
    } catch {}
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(type === "Success" ? [40, 30, 80] : [20]);
  }
}

export async function hapticLight() {
  await hapticImpact("Light");
}
