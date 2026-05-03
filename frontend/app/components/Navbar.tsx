"use client"

import Link from "next/link"
import { ThemeToggle } from "./ThemeToggle"

type NavbarProps = {
  backHref?: string
  backLabel?: string
  title?: string
  rightContent?: React.ReactNode
}

export function Navbar({ backHref, backLabel, title, rightContent }: NavbarProps) {
  return (
    <nav style={{
      borderBottom: "1px solid var(--border)",
      padding: "0 32px",
      height: "56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      position: "sticky",
      top: 0,
      zIndex: 50,
      background: "rgba(var(--bg-rgb, 248,249,252), 0.85)",
      backdropFilter: "blur(12px)",
      boxShadow: "var(--shadow-sm)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {backHref ? (
          <Link
            href={backHref}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)", textDecoration: "none", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border)", fontWeight: "500", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)" }}
          >
            ← {backLabel ?? "Back"}
          </Link>
        ) : (
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}>
            <div style={{ width: "28px", height: "28px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}>
              📡
            </div>
            <span style={{ fontSize: "15px", fontWeight: "700", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              PulseVC
            </span>
          </Link>
        )}
        {title && (
          <>
            <span style={{ color: "var(--border)" }}>/</span>
            <span style={{ fontSize: "14px", fontWeight: "500", color: "var(--text-primary)" }}>{title}</span>
          </>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {rightContent}
        <ThemeToggle />
      </div>
    </nav>
  )
}