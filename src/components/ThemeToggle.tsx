import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("alpha-theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("alpha-theme", next ? "dark" : "light");
  }
  return (
    <button type="button" onClick={toggle} aria-label={t("toggleTheme")} title={t("toggleTheme")}
      className="inline-flex min-h-11 items-center rounded-md px-2.5 text-muted-foreground transition-colors hover:text-foreground">
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
