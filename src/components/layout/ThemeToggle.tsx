"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="rounded-lg p-2 text-byg-muted transition-colors hover:bg-[var(--byg-nav-hover)] hover:text-byg-text"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
