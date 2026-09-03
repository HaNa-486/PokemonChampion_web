"use client";

import { useEffect } from "react";

export function useDialogEscape(onClose: () => void | false) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const handled = onClose();
      if (handled !== false) event.preventDefault();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
}
