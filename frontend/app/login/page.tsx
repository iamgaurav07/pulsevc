"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { ThemeToggle } from "@/app/components/ThemeToggle"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Theme toggle top right */}
      <div style={{ position: "absolute", top: "16px", right: "16px" }}>
        <ThemeToggle />
      </div>

      <div style={{ width: "100%", maxWidth: "400px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ width: "52px", height: "52px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 16px", boxShadow: "0 4px 16px rgba(99,102,241,0.3)" }}>
            📡
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "-0.5px", marginBottom: "6px" }}>PulseVC</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>AI-powered VC portfolio intelligence</p>
        </div>

        {/* Card */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "32px", boxShadow: "var(--shadow)" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "6px" }}>Sign in</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "24px" }}>
            Connect with GitHub to access your portfolios
          </p>

          <button
            onClick={async () => {
              setLoading(true)
              await signIn("github", { callbackUrl: "/dashboard" })
            }}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              border: "1px solid var(--border)",
              background: loading ? "var(--bg)" : "var(--bg-card)",
              padding: "12px 20px",
              borderRadius: "var(--radius)",
              fontSize: "14px", fontWeight: "600",
              color: "var(--text-primary)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.15s",
              boxShadow: "var(--shadow-sm)",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.borderColor = "var(--accent)" }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)" }}
          >
            {loading ? (
              <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Connecting...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
                Continue with GitHub
              </>
            )}
          </button>

          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", textAlign: "center", marginTop: "20px" }}>
            By signing in you agree to our terms of service
          </p>
        </div>

        {/* Features */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginTop: "20px" }}>
          {[
            { icon: "📈", label: "Forecasting" },
            { icon: "🚨", label: "Anomaly Detection" },
            { icon: "💬", label: "AI Q&A" },
          ].map((f) => (
            <div key={f.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "12px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>{f.icon}</div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "500" }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}