"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

export const THEME_STORAGE_KEY = "champions-lab-theme-v1";

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function savedTheme(): ThemeMode | null {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "dark" || saved === "light" ? saved : null;
}

function systemTheme(): ThemeMode {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function preferredTheme(): ThemeMode {
  return savedTheme() ?? systemTheme();
}

function watchSystemTheme(onChange: (theme: ThemeMode) => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (event: MediaQueryListEvent) => {
    if (!savedTheme()) onChange(event.matches ? "dark" : "light");
  };
  query.addEventListener("change", handleChange);
  return () => query.removeEventListener("change", handleChange);
}

export function ThemePreferenceSync() {
  useEffect(() => {
    applyTheme(preferredTheme());
    return watchSystemTheme(applyTheme);
  }, []);
  return null;
}

export function useThemePreference() {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    const preferred = preferredTheme();
    applyTheme(preferred);
    // Browser storage is unavailable during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(preferred);
    return watchSystemTheme((next) => {
      applyTheme(next);
      setThemeState(next);
    });
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}

export function ThemeToggle({ theme, locale, onChange }: {
  theme: ThemeMode;
  locale: "en" | "zh-Hant";
  onChange: (theme: ThemeMode) => void;
}) {
  const groupLabel = locale === "zh-Hant" ? "顯示模式" : "Display mode";
  const darkLabel = theme === "dark"
    ? (locale === "zh-Hant" ? "深色模式（目前使用）" : "Dark mode (current)")
    : (locale === "zh-Hant" ? "切換為深色模式" : "Switch to dark mode");
  const lightLabel = theme === "light"
    ? (locale === "zh-Hant" ? "淺色模式（目前使用）" : "Light mode (current)")
    : (locale === "zh-Hant" ? "切換為淺色模式" : "Switch to light mode");

  return <div className="segmented theme-segmented" role="group" aria-label={groupLabel}>
    <button type="button" className={`theme-button ${theme === "dark" ? "active" : ""}`} aria-label={darkLabel} aria-pressed={theme === "dark"} title={darkLabel} onClick={() => onChange("dark")}>BD</button>
    <button type="button" className={`theme-button ${theme === "light" ? "active" : ""}`} aria-label={lightLabel} aria-pressed={theme === "light"} title={lightLabel} onClick={() => onChange("light")}>WP</button>
  </div>;
}
