"use client"

import { useTheme } from "./ThemeProvider"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "16px",
        transition: "all 0.2s",
        boxShadow: "var(--shadow-sm)",
      }}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)"
        e.currentTarget.style.background = "var(--accent-light)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)"
        e.currentTarget.style.background = "var(--bg-card)"
      }}
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  )
}