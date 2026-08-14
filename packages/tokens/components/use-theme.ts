"use client";

import { useCallback, useEffect, useState } from "react";
import type { ToronTheme } from "../tokens";

export const THEME_STORAGE_KEY = "toron-theme";

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

export function themeInitScript(): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )});document.documentElement.classList.toggle("paper",t==="paper");}catch(e){}})();`;
}
