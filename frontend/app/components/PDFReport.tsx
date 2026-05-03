"use client"

import { useState } from "react"

type PDFReportProps = {
  portfolioId: string
  portfolioName: string
}

export function PDFReport({ portfolioId, portfolioName }: PDFReportProps) {
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    setGenerating(true)
    try {
      const jsPDF = (await import("jspdf")).default

      const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

      // fetch all data
      const [portfolioRes, anomalyRes] = await Promise.all([
        fetch(`${API_URL}/upload/portfolio/${portfolioId}`),
        fetch(`${API_URL}/analysis/anomaly/${portfolioId}`),
      ])

      const portfolio = await portfolioRes.json()
      const anomaly = await anomalyRes.json()

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      let y = margin

      const addPage = () => {
        doc.addPage()
        y = margin
      }

      const checkPage = (needed: number) => {
        if (y + needed > pageHeight - margin) addPage()
      }

      // ── Header ──────────────────────────────────────
      doc.setFillColor(99, 102, 241)
      doc.rect(0, 0, pageWidth, 40, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(22)
      doc.setFont("helvetica", "bold")
      doc.text("PulseVC", margin, 18)

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text("AI-powered VC Portfolio Intelligence Report", margin, 27)

      doc.setFontSize(9)
      doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, margin, 35)

      y = 52

      // ── Portfolio name ───────────────────────────────
      doc.setTextColor(15, 17, 23)
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.text(portfolio.name, margin, y)
      y += 8

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 120)
      doc.text(`${portfolio.companies?.length ?? 0} companies in portfolio`, margin, y)
      y += 14

      // ── Summary stats ────────────────────────────────
      doc.setDrawColor(226, 230, 240)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8

      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 17, 23)
      doc.text("Portfolio Summary", margin, y)
      y += 8

      const healthy = anomaly.summary?.healthy ?? 0
      const watch = anomaly.summary?.watch ?? 0
      const danger = anomaly.summary?.danger ?? 0
      const total = portfolio.companies?.length ?? 0

      // stat boxes
      const boxW = (pageWidth - margin * 2 - 12) / 4
      const boxes = [
        { label: "Total Companies", value: String(total), color: [99, 102, 241] },
        { label: "Healthy", value: String(healthy), color: [16, 185, 129] },
        { label: "Watch", value: String(watch), color: [245, 158, 11] },
        { label: "Danger", value: String(danger), color: [239, 68, 68] },
      ]

      boxes.forEach((box, i) => {
        const x = margin + i * (boxW + 4)
        doc.setFillColor(245, 246, 252)
        doc.roundedRect(x, y, boxW, 22, 2, 2, "F")
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(box.color[0], box.color[1], box.color[2])
        doc.text(box.value, x + boxW / 2, y + 12, { align: "center" })
        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 120)
        doc.text(box.label, x + boxW / 2, y + 19, { align: "center" })
      })
      y += 30

      // ── Critical alerts ──────────────────────────────
      const criticalAlerts = anomaly.alerts?.filter((a: { severity: string }) => a.severity === "critical") ?? []
      if (criticalAlerts.length > 0) {
        checkPage(20)
        doc.setFillColor(254, 242, 242)
        doc.roundedRect(margin, y, pageWidth - margin * 2, 8 + criticalAlerts.slice(0, 5).length * 7, 2, 2, "F")
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(239, 68, 68)
        doc.text("🚨 Critical Alerts", margin + 4, y + 6)
        y += 10
        criticalAlerts.slice(0, 5).forEach((alert: { company: string; message: string }) => {
          doc.setFontSize(9)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(185, 28, 28)
          doc.text(`• ${alert.company}: ${alert.message}`, margin + 4, y)
          y += 7
        })
        y += 6
      }

      // ── Company details ──────────────────────────────
      checkPage(20)
      doc.setDrawColor(226, 230, 240)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8

      doc.setFontSize(13)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 17, 23)
      doc.text("Company Analysis", margin, y)
      y += 10

      const anomalyMap: Record<string, { status: string; health_score: number; alerts: { severity: string; message: string }[]; latest_metrics: { revenue: number; burn_rate: number; runway_months: number; growth_rate: number } }> = {}
      anomaly.companies?.forEach((c: { company_name: string; status: string; health_score: number; alerts: { severity: string; message: string }[]; latest_metrics: { revenue: number; burn_rate: number; runway_months: number; growth_rate: number } }) => {
        anomalyMap[c.company_name] = c
      })

      const statusColors: Record<string, number[]> = {
        healthy: [16, 185, 129],
        watch: [245, 158, 11],
        danger: [239, 68, 68],
      }

      portfolio.companies?.slice(0, 30).forEach((company: { name: string; sector: string; stage: string; latest_revenue: number; latest_runway: number }) => {
        checkPage(36)

        const anom = anomalyMap[company.name]
        const status = anom?.status ?? "unknown"
        const statusColor = statusColors[status] ?? [150, 150, 150]

        // company card background
        doc.setFillColor(248, 249, 252)
        doc.roundedRect(margin, y, pageWidth - margin * 2, 32, 2, 2, "F")

        // status indicator
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
        doc.roundedRect(margin, y, 3, 32, 1, 1, "F")

        // company name
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(15, 17, 23)
        doc.text(company.name, margin + 8, y + 8)

        // sector + stage
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(100, 100, 120)
        doc.text(`${company.sector ?? "N/A"} · ${company.stage ?? "N/A"}`, margin + 8, y + 15)

        // status badge
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
        doc.text(status.toUpperCase(), pageWidth - margin - 4, y + 8, { align: "right" })

        // metrics row
        const metrics = [
          { label: "Revenue", value: company.latest_revenue ? `$${(company.latest_revenue / 1000).toFixed(0)}K` : "N/A" },
          { label: "Runway", value: company.latest_runway != null ? `${company.latest_runway}mo` : "N/A" },
          { label: "Growth", value: anom?.latest_metrics?.growth_rate != null ? `${anom.latest_metrics.growth_rate.toFixed(1)}%` : "N/A" },
          { label: "Burn", value: anom?.latest_metrics?.burn_rate ? `$${(anom.latest_metrics.burn_rate / 1000).toFixed(0)}K/mo` : "N/A" },
        ]

        metrics.forEach((m, i) => {
          const mx = margin + 8 + i * 42
          doc.setFontSize(9)
          doc.setFont("helvetica", "bold")
          doc.setTextColor(15, 17, 23)
          doc.text(m.value, mx, y + 24)
          doc.setFontSize(7)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(150, 150, 160)
          doc.text(m.label, mx, y + 29)
        })

        // alerts
        if (anom?.alerts?.length > 0) {
          const alert = anom.alerts[0]
          doc.setFontSize(7)
          doc.setFont("helvetica", "italic")
          doc.setTextColor(alert.severity === "critical" ? 239 : 245, alert.severity === "critical" ? 68 : 158, alert.severity === "critical" ? 68 : 11)
          const alertText = doc.splitTextToSize(`⚠ ${alert.message}`, 80)
          doc.text(alertText, pageWidth - margin - 4, y + 24, { align: "right" })
        }

        y += 36
      })

      if (portfolio.companies?.length > 30) {
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 120)
        doc.text(`... and ${portfolio.companies.length - 30} more companies`, margin, y)
        y += 8
      }

      // ── Footer ───────────────────────────────────────
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFillColor(248, 249, 252)
        doc.rect(0, pageHeight - 12, pageWidth, 12, "F")
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(150, 150, 160)
        doc.text("Generated by PulseVC — AI-powered VC portfolio intelligence", margin, pageHeight - 4)
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 4, { align: "right" })
      }

      // save
      doc.save(`${portfolioName.replace(/\s+/g, "_")}_PulseVC_Report.pdf`)
    } catch (error) {
      console.error("PDF generation error:", error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        fontSize: "13px", fontWeight: "600",
        background: generating ? "var(--bg-card)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: generating ? "var(--text-secondary)" : "white",
        border: "1px solid",
        borderColor: generating ? "var(--border)" : "transparent",
        padding: "8px 16px",
        borderRadius: "var(--radius)",
        cursor: generating ? "not-allowed" : "pointer",
        transition: "all 0.2s",
        boxShadow: generating ? "none" : "0 2px 8px rgba(99,102,241,0.3)",
      }}
    >
      {generating ? (
        <>
          <span style={{ animation: "pulse 1s infinite" }}>⏳</span>
          Generating...
        </>
      ) : (
        <>
          📄 Export PDF
        </>
      )}
    </button>
  )
}