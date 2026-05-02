"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const PER_PAGE = 20

// ── Types ──────────────────────────────────────────────────────────────────
type Company = {
  id: string
  name: string
  sector: string
  stage: string
  latest_revenue: number
  latest_runway: number
  metrics_count: number
}

type Alert = {
  severity: string
  message: string
  company: string
  metric?: string
}

type AnomalyResult = {
  company_id: string
  company_name: string
  sector: string
  stage: string
  status: string
  health_score: number
  alerts: Alert[]
  latest_metrics: {
    revenue: number
    burn_rate: number
    runway_months: number
    growth_rate: number
    headcount: number
  }
}

type RevenueForecast = {
  historical: { date: string; actual: number; predicted: number }[]
  forecast: { date: string; predicted: number; lower: number; upper: number }[]
  trend: string
  growth_forecast: number
}

type ForecastResult = {
  company_id: string
  company_name: string
  forecast: { revenue?: RevenueForecast }
}

type PortfolioData = {
  id: string
  name: string
  companies: Company[]
}

type AnomalyData = {
  summary: Record<string, number>
  alerts: Alert[]
  companies: AnomalyResult[]
}

type ForecastData = {
  companies: ForecastResult[]
}

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatCurrency = (value: number) => {
  if (!value && value !== 0) return "N/A"
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  healthy: { bg: "var(--success-light)", color: "#34d399", border: "rgba(16,185,129,0.2)" },
  watch: { bg: "var(--warning-light)", color: "#fbbf24", border: "rgba(245,158,11,0.2)" },
  danger: { bg: "var(--danger-light)", color: "#f87171", border: "rgba(239,68,68,0.2)" },
  insufficient_data: { bg: "var(--bg)", color: "var(--text-tertiary)", border: "var(--border)" },
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ width = "100%", height = 20 }: { width?: string | number; height?: number }) {
  return (
    <div style={{
      width, height,
      background: "linear-gradient(90deg, var(--bg-card) 25%, #1f2235 50%, var(--bg-card) 75%)",
      backgroundSize: "200% 100%",
      borderRadius: "6px",
      animation: "shimmer 1.5s infinite",
    }} />
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const params = useParams()
  const portfolioId = params.id as string

  const [activeTab, setActiveTab] = useState<"overview" | "forecast" | "anomaly" | "chat">("overview")
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const res = await fetch(`${API_URL}/upload/portfolio/${portfolioId}`)
        const data: PortfolioData = await res.json()
        setPortfolio(data)
        if (data.companies?.length > 0) {
          setSelectedCompany(data.companies[0].id)
        }
      } catch {
        console.error("Failed to load portfolio")
      } finally {
        setLoading(false)
      }
    }
    loadPortfolio()
  }, [portfolioId])

  const runAnomalyAnalysis = async () => {
    setAnalysisLoading(true)
    try {
      const res = await fetch(`${API_URL}/analysis/anomaly/${portfolioId}`)
      const data: AnomalyData = await res.json()
      setAnomalyData(data)
    } catch {
      console.error("Failed to run anomaly analysis")
    } finally {
      setAnalysisLoading(false)
    }
  }

  const runForecast = async () => {
    setAnalysisLoading(true)
    try {
      const res = await fetch(`${API_URL}/forecast/portfolio/${portfolioId}`)
      const data: ForecastData = await res.json()
      setForecastData(data)
    } catch {
      console.error("Failed to run forecast")
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab === "anomaly" && !anomalyData && !analysisLoading) runAnomalyAnalysis()
    if (tab === "forecast" && !forecastData && !analysisLoading) runForecast()
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return
    const question = chatInput
    setChatInput("")
    setChatMessages(prev => [...prev, { role: "user", content: question }])
    setChatLoading(true)
    try {
      const res = await fetch(`${API_URL}/chat/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio_id: portfolioId, question }),
      })
      const data = await res.json()
      setChatMessages(prev => [...prev, { role: "assistant", content: data.answer }])
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong." }])
    } finally {
      setChatLoading(false)
    }
  }

  // pagination
  const totalPages = Math.ceil((portfolio?.companies?.length ?? 0) / PER_PAGE)
  const paginatedCompanies = portfolio?.companies?.slice((page - 1) * PER_PAGE, page * PER_PAGE) ?? []

  // forecast chart data
  const selectedForecast = forecastData?.companies?.find(c => c.company_id === selectedCompany)
  const forecastChartData = selectedForecast?.forecast?.revenue ? [
    ...selectedForecast.forecast.revenue.historical.map(h => ({
      date: h.date, actual: h.actual, predicted: h.predicted, type: "historical",
    })),
    ...selectedForecast.forecast.revenue.forecast.map(f => ({
      date: f.date, predicted: f.predicted, lower: f.lower, upper: f.upper, type: "forecast",
    })),
  ] : []

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <nav style={{ borderBottom: "1px solid var(--border)", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", background: "var(--bg)" }}>
          <Skeleton width={200} height={16} />
        </nav>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
                <Skeleton height={12} width="40%" />
                <div style={{ marginTop: "16px" }}><Skeleton height={32} width="60%" /></div>
                <div style={{ marginTop: "8px" }}><Skeleton height={10} width="50%" /></div>
              </div>
            ))}
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                <Skeleton height={14} width={`${60 + i * 5}%`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "0 32px", height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, background: "rgba(15,17,23,0.9)", backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)", textDecoration: "none", padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            ← Back
          </Link>
          <span style={{ color: "var(--border)" }}>/</span>
          <span style={{ fontSize: "14px", fontWeight: "600" }}>{portfolio?.name}</span>
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-tertiary)", background: "var(--bg-card)", padding: "3px 10px", borderRadius: "20px", border: "1px solid var(--border)" }}>
          {portfolio?.companies?.length} companies
        </span>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "32px", background: "var(--bg-card)", padding: "4px", borderRadius: "var(--radius)", border: "1px solid var(--border)", width: "fit-content" }}>
          {[
            { key: "overview", label: "📊 Overview" },
            { key: "forecast", label: "📈 Forecast" },
            { key: "anomaly", label: "🚨 Anomaly" },
            { key: "chat", label: "💬 Ask AI" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as typeof activeTab)}
              style={{
                fontSize: "13px", fontWeight: "500",
                padding: "8px 16px", borderRadius: "8px",
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: activeTab === tab.key ? "var(--accent)" : "transparent",
                color: activeTab === tab.key ? "white" : "var(--text-secondary)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ─────────────────────────────── */}
        {activeTab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "Total Companies", value: portfolio?.companies?.length ?? 0, icon: "🏢", format: false },
                {
                  label: "Avg Revenue",
                  value: formatCurrency((portfolio?.companies?.reduce((s, c) => s + (c.latest_revenue ?? 0), 0) ?? 0) / (portfolio?.companies?.length || 1)),
                  icon: "💰", format: true,
                },
                {
                  label: "Avg Runway",
                  value: `${((portfolio?.companies?.reduce((s, c) => s + (c.latest_runway ?? 0), 0) ?? 0) / (portfolio?.companies?.length || 1)).toFixed(1)} mo`,
                  icon: "⏱️", format: true,
                },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
                  <div style={{ fontSize: "24px", marginBottom: "12px" }}>{stat.icon}</div>
                  <div style={{ fontSize: "28px", fontWeight: "700", letterSpacing: "-1px", marginBottom: "4px" }}>{stat.value}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: "500" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontSize: "14px", fontWeight: "600" }}>Companies</h2>
                <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, portfolio?.companies?.length ?? 0)} of {portfolio?.companies?.length}
                </span>
              </div>

              {paginatedCompanies.map((company, i) => (
                <div
                  key={company.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < paginatedCompanies.length - 1 ? "1px solid var(--border)" : "none", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", background: "var(--accent-light)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🏢</div>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "2px" }}>{company.name}</p>
                      <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{company.sector} · {company.stage}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "32px", textAlign: "right" }}>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "600" }}>{formatCurrency(company.latest_revenue)}</p>
                      <p style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Revenue</p>
                    </div>
                    <div>
                      <p style={{ fontSize: "13px", fontWeight: "600", color: (company.latest_runway ?? 0) < 6 ? "#f87171" : (company.latest_runway ?? 0) < 12 ? "#fbbf24" : "#34d399" }}>
                        {company.latest_runway != null ? `${company.latest_runway} mo` : "N/A"}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>Runway</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px 20px", borderTop: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ fontSize: "13px", padding: "6px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: page === 1 ? "var(--text-tertiary)" : "var(--text-primary)", cursor: page === 1 ? "not-allowed" : "pointer" }}
                  >
                    ← Prev
                  </button>
                  <span style={{ fontSize: "13px", color: "var(--text-tertiary)", minWidth: "100px", textAlign: "center" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ fontSize: "13px", padding: "6px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: page === totalPages ? "var(--text-tertiary)" : "var(--text-primary)", cursor: page === totalPages ? "not-allowed" : "pointer" }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FORECAST TAB ─────────────────────────────── */}
        {activeTab === "forecast" && (
          <div>
            {analysisLoading ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
                      <Skeleton height={12} width="40%" />
                      <div style={{ marginTop: "16px" }}><Skeleton height={28} width="60%" /></div>
                      <div style={{ marginTop: "8px" }}><Skeleton height={10} width="50%" /></div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "16px" }}>📈</div>
                  <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--accent)", marginBottom: "8px" }}>
                    Running Prophet forecasting...
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "20px" }}>
                    Analyzing {portfolio?.companies?.length} companies — may take 15–30 seconds
                  </p>
                  <div style={{ width: "200px", height: "3px", background: "var(--border)", borderRadius: "2px", margin: "0 auto", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)", borderRadius: "2px", animation: "slide 2s infinite" }} />
                  </div>
                  <div style={{ marginTop: "24px" }}><Skeleton height={260} /></div>
                </div>
              </div>
            ) : forecastData ? (
              <div>
                {/* Company selector */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
                  {forecastData.companies.slice(0, 20).map((c) => (
                    <button
                      key={c.company_id}
                      onClick={() => setSelectedCompany(c.company_id)}
                      style={{
                        fontSize: "12px", fontWeight: "500",
                        padding: "6px 12px", borderRadius: "8px", border: "1px solid",
                        cursor: "pointer", transition: "all 0.15s",
                        borderColor: selectedCompany === c.company_id ? "var(--accent)" : "var(--border)",
                        background: selectedCompany === c.company_id ? "var(--accent-light)" : "var(--bg-card)",
                        color: selectedCompany === c.company_id ? "#818cf8" : "var(--text-secondary)",
                      }}
                    >
                      {c.company_name}
                    </button>
                  ))}
                  {forecastData.companies.length > 20 && (
                    <span style={{ fontSize: "12px", color: "var(--text-tertiary)", padding: "6px 12px" }}>
                      +{forecastData.companies.length - 20} more
                    </span>
                  )}
                </div>

                {/* Chart */}
                {selectedForecast?.forecast?.revenue && (
                  <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                      <div>
                        <h3 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>
                          {selectedForecast.company_name} — Revenue Forecast
                        </h3>
                        <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                          Historical + 6 month Prophet forecast
                        </p>
                      </div>
                      <div style={{
                        fontSize: "13px", fontWeight: "600",
                        padding: "6px 14px", borderRadius: "20px",
                        background: selectedForecast.forecast.revenue.trend === "up" ? "var(--success-light)" : "var(--danger-light)",
                        color: selectedForecast.forecast.revenue.trend === "up" ? "#34d399" : "#f87171",
                        border: `1px solid ${selectedForecast.forecast.revenue.trend === "up" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                      }}>
                        {selectedForecast.forecast.revenue.trend === "up" ? "↑" : "↓"} {selectedForecast.forecast.revenue.growth_forecast}% forecast
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={forecastChartData}>
                        <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip
                          contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "12px" }}
                          formatter={(value) => [value != null ? formatCurrency(Number(value)) : "N/A", ""]}
                        />
                        <Area type="monotone" dataKey="actual" stroke="#6366f1" fill="url(#colorActual)" strokeWidth={2} dot={false} name="Actual" />
                        <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" fill="url(#colorForecast)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Summary grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                  {forecastData.companies.map((c) => (
                    <div
                      key={c.company_id}
                      onClick={() => setSelectedCompany(c.company_id)}
                      style={{ background: "var(--bg-card)", border: `1px solid ${selectedCompany === c.company_id ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius)", padding: "14px", cursor: "pointer", transition: "all 0.15s" }}
                    >
                      <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>{c.company_name}</p>
                      {c.forecast?.revenue ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            fontSize: "12px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px",
                            background: c.forecast.revenue.trend === "up" ? "var(--success-light)" : "var(--danger-light)",
                            color: c.forecast.revenue.trend === "up" ? "#34d399" : "#f87171",
                          }}>
                            {c.forecast.revenue.trend === "up" ? "↑" : "↓"} {c.forecast.revenue.growth_forecast}%
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>6-month</span>
                        </div>
                      ) : (
                        <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Insufficient data</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── ANOMALY TAB ─────────────────────────────── */}
        {activeTab === "anomaly" && (
          <div>
            {analysisLoading ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px" }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px", textAlign: "center" }}>
                      <Skeleton height={32} width="40%" />
                      <div style={{ marginTop: "8px" }}><Skeleton height={10} width="60%" /></div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "32px", textAlign: "center" }}>
                  <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔍</div>
                  <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--accent)", marginBottom: "8px" }}>
                    Running Isolation Forest anomaly detection...
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "20px" }}>
                    Scanning {portfolio?.companies?.length} companies for unusual patterns
                  </p>
                  <div style={{ width: "200px", height: "3px", background: "var(--border)", borderRadius: "2px", margin: "0 auto", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg, #ef4444, #f87171)", borderRadius: "2px", animation: "slide 2s infinite" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: "12px", marginTop: "24px" }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px" }}>
                        <Skeleton height={14} width="60%" />
                        <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          {[1, 2, 3, 4].map(j => <Skeleton key={j} height={40} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : anomalyData ? (
              <div>
                {/* Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "24px" }}>
                  {[
                    { label: "Healthy", key: "healthy", color: "#34d399", bg: "var(--success-light)", icon: "✅" },
                    { label: "Watch", key: "watch", color: "#fbbf24", bg: "var(--warning-light)", icon: "⚠️" },
                    { label: "Danger", key: "danger", color: "#f87171", bg: "var(--danger-light)", icon: "🚨" },
                  ].map((s) => (
                    <div key={s.key} style={{ background: s.bg, border: `1px solid ${s.color}30`, borderRadius: "var(--radius)", padding: "20px", textAlign: "center" }}>
                      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
                      <div style={{ fontSize: "32px", fontWeight: "700", color: s.color, marginBottom: "4px" }}>
                        {anomalyData.summary[s.key] ?? 0}
                      </div>
                      <div style={{ fontSize: "12px", color: s.color, fontWeight: "500" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Critical alerts */}
                {anomalyData.alerts?.filter(a => a.severity === "critical").length > 0 && (
                  <div style={{ background: "var(--danger-light)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius)", padding: "16px 20px", marginBottom: "20px" }}>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "#f87171", marginBottom: "10px" }}>🚨 Critical Alerts</p>
                    {anomalyData.alerts.filter(a => a.severity === "critical").slice(0, 5).map((alert, i) => (
                      <p key={i} style={{ fontSize: "13px", color: "#fca5a5", marginBottom: "4px" }}>
                        <strong>{alert.company}:</strong> {alert.message}
                      </p>
                    ))}
                    {anomalyData.alerts.filter(a => a.severity === "critical").length > 5 && (
                      <p style={{ fontSize: "12px", color: "#f87171", marginTop: "6px" }}>
                        +{anomalyData.alerts.filter(a => a.severity === "critical").length - 5} more critical alerts
                      </p>
                    )}
                  </div>
                )}

                {/* Companies grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: "12px" }}>
                  {anomalyData.companies.map((company) => {
                    const s = statusColors[company.status] ?? statusColors.insufficient_data
                    return (
                      <div key={company.company_id} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                          <p style={{ fontSize: "14px", fontWeight: "600" }}>{company.company_name}</p>
                          <span style={{ fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px", background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: "capitalize" }}>
                            {company.status.replace("_", " ")}
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                          {[
                            { label: "Revenue", value: formatCurrency(company.latest_metrics?.revenue) },
                            { label: "Growth", value: company.latest_metrics?.growth_rate != null ? `${company.latest_metrics.growth_rate}%` : "N/A" },
                            { label: "Burn", value: formatCurrency(company.latest_metrics?.burn_rate) },
                            { label: "Runway", value: company.latest_metrics?.runway_months != null ? `${company.latest_metrics.runway_months} mo` : "N/A" },
                          ].map((m) => (
                            <div key={m.label} style={{ background: "var(--bg)", borderRadius: "8px", padding: "8px 10px" }}>
                              <p style={{ fontSize: "11px", color: "var(--text-tertiary)", marginBottom: "2px" }}>{m.label}</p>
                              <p style={{ fontSize: "13px", fontWeight: "600" }}>{m.value}</p>
                            </div>
                          ))}
                        </div>
                        {company.alerts?.length > 0 && (
                          <div>
                            {company.alerts.slice(0, 2).map((alert, i) => (
                              <p key={i} style={{ fontSize: "11px", color: alert.severity === "critical" ? "#f87171" : "#fbbf24", marginBottom: "2px" }}>
                                {alert.severity === "critical" ? "🚨" : "⚠️"} {alert.message}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ── CHAT TAB ─────────────────────────────────── */}
        {activeTab === "chat" && (
          <div style={{ display: "flex", flexDirection: "column", height: "600px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
                  <p style={{ fontSize: "15px", fontWeight: "600", marginBottom: "8px" }}>Ask anything about your portfolio</p>
                  <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "24px" }}>
                    Powered by GPT-4o-mini with your real portfolio data
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                    {[
                      "Which companies need urgent attention?",
                      "What is the fastest growing company?",
                      "Give me a portfolio health summary",
                      "Which companies will run out of runway soon?",
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => setChatInput(q)}
                        style={{ fontSize: "12px", color: "#818cf8", background: "var(--accent-light)", border: "1px solid rgba(99,102,241,0.2)", padding: "7px 14px", borderRadius: "20px", cursor: "pointer", fontWeight: "500" }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "75%", padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: msg.role === "user" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--bg)",
                    border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                    fontSize: "14px", lineHeight: "1.6",
                    color: msg.role === "user" ? "white" : "var(--text-primary)",
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                  {[0, 150, 300].map(d => (
                    <div key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-tertiary)", animation: `bounce 1.2s ${d}ms infinite` }} />
                  ))}
                </div>
              )}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", padding: "16px 24px", display: "flex", gap: "10px" }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Ask about your portfolio..."
                disabled={chatLoading}
                style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "10px", padding: "10px 14px", fontSize: "14px", color: "var(--text-primary)", outline: "none" }}
                onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
                onBlur={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              />
              <button
                onClick={sendMessage}
                disabled={chatLoading || !chatInput.trim()}
                style={{ width: "40px", height: "40px", background: chatLoading || !chatInput.trim() ? "var(--border)" : "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: "10px", cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", color: "white" }}
              >
                →
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes slide {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
      `}</style>
    </div>
  )
}