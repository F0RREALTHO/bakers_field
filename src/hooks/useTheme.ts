import { useEffect, useState } from "react";

export type Theme = "default" | "dark" | "rose" | "midnight";

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("bakersfield.theme");
    return (saved as Theme) || "default";
  });

  useEffect(() => {
    // Remove previous theme classes
    document.body.classList.remove("theme-dark", "theme-rose", "theme-midnight");
    
    // Add current theme class
    if (theme !== "default") {
      document.body.classList.add(`theme-${theme}`);
    }
    
    localStorage.setItem("bakersfield.theme", theme);
  }, [theme]);

  return { theme, setTheme };
};
