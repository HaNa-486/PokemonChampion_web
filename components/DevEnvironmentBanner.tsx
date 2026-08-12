"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

export function isDevHostname(hostname: string) {
  return hostname === "champions-lab-dev.eddy8613.chatgpt.site"
    || hostname.startsWith("champions-lab-dev.");
}

export function DevEnvironmentBanner() {
  const pathname = usePathname();
  const [target, setTarget] = useState<Element | null>(null);
  const visible = useSyncExternalStore(
    () => () => undefined,
    () => isDevHostname(window.location.hostname),
    () => false,
  );

  useEffect(() => {
    if (!visible) return;
    const frame = window.requestAnimationFrame(() => {
      setTarget(document.querySelector(".brand") ?? document.body);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, visible]);

  if (!visible || !target) return null;
  const inBrand = target.matches(".brand");

  return createPortal(
    <span className={`dev-environment-badge${inBrand ? "" : " dev-environment-fallback"}`} role="status">
      DEV / UAT
    </span>,
    target,
  );
}
