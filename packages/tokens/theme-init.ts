export const THEME_STORAGE_KEY = "toron-theme";

export function themeInitScript(): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )});document.documentElement.classList.toggle("paper",t==="paper");}catch(e){}})();`;
}
