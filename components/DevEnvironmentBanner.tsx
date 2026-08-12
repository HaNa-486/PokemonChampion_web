"use client";

import { useSyncExternalStore } from "react";

export function isDevHostname(hostname: string) {
  return hostname === "champions-lab-dev.eddy8613.chatgpt.site"
    || hostname.startsWith("champions-lab-dev.");
}

export function DevEnvironmentBanner() {
  const visible = useSyncExternalStore(
    () => () => undefined,
    () => isDevHostname(window.location.hostname),
    () => false,
  );

  if (!visible) return null;

  return (
    <div className="dev-environment-banner" role="status">
      DEV / UAT · NOT PRODUCTION
    </div>
  );
}
