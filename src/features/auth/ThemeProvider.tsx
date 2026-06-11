import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void; setTheme: (theme: Theme) => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem("ledger_theme") as Theme) || "light");

  const setTheme = (next: Theme) => {
    setThemeState(next);
    localStorage.setItem("ledger_theme", next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark") }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
