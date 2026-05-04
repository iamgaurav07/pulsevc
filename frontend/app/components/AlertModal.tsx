"use client"

import { useState } from "react"

type AlertModalProps = {
  portfolioId: string
  portfolioName: string
}

/* This is coment for the */

export function AlertModal({ portfolioId, portfolioName }: AlertModalProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const sendAlert = async () => {
    if (!email || !email.includes("@")) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch(`${API_URL}/analysis/alert/${portfolioId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setResult({ success: data.success, message: data.message })
    } catch {
      setResult({ success: false, message: "Failed to send alert" })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontSize: "13px", fontWeight: "600",
          background: "var(--danger-light)",
          color: "var(--danger)",
          border: "1px solid rgba(239,68,68,0.2)",
          padding: "8px 16px",
          borderRadius: "var(--radius)",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "#fecaca"}
        onMouseLeave={(e) => e.currentTarget.style.background = "var(--danger-light)"}
      >
        🔔 Email Alerts
      </button>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", padding: "32px", width: "100%", maxWidth: "440px", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)", animation: "fadeIn 0.2s ease" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>Send Alert Report</h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{portfolioName}</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-tertiary)", padding: "4px 8px" }}>×</button>
            </div>

            <div style={{ background: "var(--danger-light)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: "20px" }}>
              <p style={{ fontSize: "13px", color: "var(--danger)", fontWeight: "500" }}>
                🚨 This will run anomaly detection and email a report of all critical and watch companies to the address below.
              </p>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "10px 14px", fontSize: "14px", color: "var(--text-primary)", outline: "none" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                onKeyDown={(e) => { if (e.key === "Enter") sendAlert() }}
              />
            </div>

            {result && (
              <div style={{ marginBottom: "16px", background: result.success ? "var(--success-light)" : "var(--danger-light)", border: `1px solid ${result.success ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`, borderRadius: "var(--radius)", padding: "12px 16px" }}>
                <p style={{ fontSize: "13px", color: result.success ? "var(--success)" : "var(--danger)", fontWeight: "500" }}>
                  {result.success ? "✅" : "❌"} {result.message}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={sendAlert}
                disabled={sending || !email.includes("@")}
                style={{ flex: 1, background: sending || !email.includes("@") ? "var(--border)" : "var(--danger)", color: "white", border: "none", padding: "12px", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: "600", cursor: sending || !email.includes("@") ? "not-allowed" : "pointer", transition: "all 0.15s" }}
              >
                {sending ? "Sending..." : "Send Alert Email"}
              </button>
              <button
                onClick={() => setOpen(false)}
                style={{ padding: "12px 20px", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: "500", color: "var(--text-secondary)", background: "transparent", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}