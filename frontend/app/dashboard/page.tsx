"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { EmptyState } from "../components/EmptyState";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Portfolio = {
  id: string;
  name: string;
  created_at: string;
  company_count: number;
};

export default function DashboardPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const refreshPortfolios = async () => {
    const res = await fetch(`${API_URL}/upload/portfolios`);
    const data = await res.json();
    setPortfolios(data.portfolios);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/upload/portfolios`);
        const data = await res.json();
        setPortfolios(data.portfolios);
      } catch {
        setError("Failed to load portfolios");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Only CSV files are supported");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "portfolio_name",
        portfolioName || file.name.replace(".csv", ""),
      );

      const res = await fetch(`${API_URL}/upload/csv`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Upload failed");
      }

      const result = await res.json();
      setSuccess(
        `Successfully imported ${result.companies} companies with ${result.metrics} data points!`,
      );
      setPortfolioName("");
      refreshPortfolios();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />

      <div
        style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 32px" }}
      >
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
              marginBottom: "6px",
            }}
          >
            Portfolio Dashboard
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Upload your portfolio CSV to get AI-powered insights
          </p>
        </div>

        {/* Cold start warning */}
        <div
          style={{
            background: "var(--warning-light)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "var(--radius)",
            padding: "12px 20px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "18px" }}>⚡</span>
          <div>
            <p
              style={{
                fontSize: "13px",
                fontWeight: "600",
                color: "#fbbf24",
                marginBottom: "2px",
              }}
            >
              Free tier — cold start may take 30-60 seconds
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              The backend spins down after inactivity. First request may be slow
              — please wait.
            </p>
          </div>
        </div>

        {/* Upload section */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "32px",
            marginBottom: "32px",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "20px",
            }}
          >
            Upload Portfolio
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="Portfolio name (optional)"
              style={{
                width: "100%",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "10px 14px",
                fontSize: "14px",
                color: "var(--text-primary)",
                outline: "none",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "var(--accent)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "var(--border)")
              }
            />
          </div>

          {/* Drop zone */}
          <div
            onClick={() => {
              if (!uploading) fileInputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file) handleUpload(file);
            }}
            style={{
              border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "var(--radius-lg)",
              padding: "40px",
              textAlign: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              background: dragOver ? "var(--accent-light)" : "transparent",
              transition: "all 0.2s",
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />

            {uploading ? (
              <div>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--accent)",
                  }}
                >
                  Processing your portfolio...
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-tertiary)",
                    marginTop: "4px",
                  }}
                >
                  Importing companies and metrics
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>📂</div>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {dragOver
                    ? "Drop your CSV here"
                    : "Click to upload or drag & drop"}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                  CSV columns: company_name, date, revenue, growth_rate,
                  burn_rate, runway_months
                </p>
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: "12px",
                background: "var(--danger-light)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#f87171",
                fontSize: "13px",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
              }}
            >
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div
              style={{
                marginTop: "12px",
                background: "var(--success-light)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#34d399",
                fontSize: "13px",
                padding: "10px 14px",
                borderRadius: "var(--radius)",
              }}
            >
              ✅ {success}
            </div>
          )}
        </div>

        {/* Portfolios list */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: "600" }}>
              Your Portfolios
            </h2>
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-tertiary)",
                background: "var(--bg-card)",
                padding: "2px 10px",
                borderRadius: "20px",
                border: "1px solid var(--border)",
              }}
            >
              {portfolios.length} portfolio{portfolios.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px",
                color: "var(--text-tertiary)",
                fontSize: "14px",
              }}
            >
              Loading portfolios...
            </div>
          ) : portfolios.length === 0 ? (
            <EmptyState
              icon="📊"
              title="No portfolios yet"
              description="Upload your first CSV to get AI-powered forecasting, anomaly detection, and natural language insights."
              action={
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: "var(--radius)",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                  }}
                >
                  Upload your first portfolio
                </button>
              }
            />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {portfolios.map((portfolio) => (
                <Link
                  key={portfolio.id}
                  href={`/portfolio/${portfolio.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      padding: "24px",
                      transition: "all 0.2s",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 1px var(--accent), 0 4px 20px rgba(99,102,241,0.15)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          background: "var(--accent-light)",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          border: "1px solid rgba(99,102,241,0.2)",
                        }}
                      >
                        📊
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-tertiary)",
                          background: "var(--bg)",
                          padding: "3px 10px",
                          borderRadius: "20px",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {portfolio.company_count} companies
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                        marginBottom: "6px",
                      }}
                    >
                      {portfolio.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      Created{" "}
                      {new Date(portfolio.created_at).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </p>
                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "14px",
                        borderTop: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--accent)",
                          fontWeight: "600",
                        }}
                      >
                        View analysis →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
