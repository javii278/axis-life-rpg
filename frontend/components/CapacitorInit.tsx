"use client";
import { useEffect } from "react";

// Runs once at app start to configure native Capacitor APIs.
// Gracefully no-ops on web/browser.
export function CapacitorInit() {
  useEffect(() => {
    initNative();
  }, []);

  return null;
}

async function initNative() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return;

    // StatusBar: dark overlay, matching our #0a0a0f background
    try {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: "#0a0a0f" });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch {}
  } catch {}
}
