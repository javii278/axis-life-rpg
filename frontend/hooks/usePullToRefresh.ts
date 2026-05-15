"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { hapticLight } from "@/lib/haptics";

export function usePullToRefresh(onRefresh: () => void) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const trigger = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    hapticLight();
    onRefresh();
    setTimeout(() => setRefreshing(false), 900);
  }, [onRefresh, refreshing]);

  useEffect(() => {
    const el = document.querySelector("main") as HTMLElement | null;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (el.scrollTop === 0) startY.current = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      if (startY.current === null) return;
      const delta = e.changedTouches[0].clientY - startY.current;
      if (delta > 72) trigger();
      startY.current = null;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [trigger]);

  return { refreshing };
}
