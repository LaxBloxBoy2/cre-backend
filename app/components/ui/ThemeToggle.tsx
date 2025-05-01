"use client";

import { useTheme } from "../../contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { GradientButton } from "./GradientButton";

export function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <GradientButton
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="rounded-full bg-dark-card-hover hover:bg-dark-card-hover/80 transition-all duration-200"
    >
      {isDarkMode ? (
        <Moon className="h-5 w-5 text-accent" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </GradientButton>
  );
}
