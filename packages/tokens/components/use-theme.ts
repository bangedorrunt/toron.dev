"use client";

import { useCallback, useEffect, useState } from "react";
import type { ToronTheme } from "../tokens";
import { THEME_STORAGE_KEY } from "../theme-init";

export { THEME_STORAGE_KEY } from "../theme-init";

export function useTheme(): [ToronTheme, (theme: ToronTheme) => void] {
  const [theme, setTheme] = useState<ToronTheme>(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("paper")
      ? "paper"
      : "dark",
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("paper", theme === "paper");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // storage unavailable (private mode / disabled)
    }
  }, [theme]);

  const setToronTheme = useCallback((next: ToronTheme) => {
    setTheme(next);
  }, []);

  return [theme, setToronTheme];
}
