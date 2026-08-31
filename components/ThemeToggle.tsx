"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "champions-lab-theme-v1";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function savedTheme(): ThemeMode {
  return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}

export function ThemePreferenceSync() {
  useEffect(() => {
    applyTheme(savedTheme());
  }, []);
  return null;
}

export function useThemePreference() {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = savedTheme();
    applyTheme(stored);
    // Browser storage is unavailable during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(stored);
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}

export function ThemeToggle({ theme, locale, onToggle }: {
  theme: ThemeMode;
  locale: "en" | "zh-Hant";
  onToggle: () => void;
}) {
  const label = theme === "dark"
    ? (locale === "zh-Hant" ? "切換為淺色模式" : "Switch to light mode")
    : (locale === "zh-Hant" ? "切換為深色模式" : "Switch to dark mode");

  return <button type="button" className="theme-button" aria-label={label} aria-pressed={theme === "dark"} title={label} onClick={onToggle}>{theme === "dark" ? "BD" : "WP"}</button>;
}
