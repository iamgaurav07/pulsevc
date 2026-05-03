"use client";

import Link from "next/link";
import { Navbar } from "./components/Navbar";

const features = [
  {
    icon: "📊",
    title: "Portfolio Upload",
    desc: "Upload your portfolio CSV and instantly visualize all your companies in one place.",
  },
  {
    icon: "📈",
    title: "Revenue Forecasting",
    desc: "Prophet-powered time series forecasting predicts next 6-12 months for every company.",
  },
  {
    icon: "🚨",
    title: "Anomaly Detection",
    desc: "Isolation Forest ML automatically flags companies with unusual patterns or risk signals.",
  },
  {
    icon: "🔍",
    title: "Smart Clustering",
    desc: "KMeans groups similar companies so you can spot patterns across your portfolio.",
  },
  {
    icon: "💬",
    title: "Natural Language Q&A",
    desc: "Ask any question about your portfolio in plain English and get instant AI insights.",
  },
  {
    icon: "⚡",
    title: "Real-time Alerts",
    desc: "Critical alerts for runway, burn rate, and growth rate issues surfaced automatically.",
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Navbar */}
      <Navbar
        rightContent={
          <Link
            href="/dashboard"
            style={{
              fontSize: "14px",
              fontWeight: "600",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              padding: "8px 18px",
              borderRadius: "8px",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}
          >
            Get started
          </Link>
        }
      />

      {/* Hero */}
      <section
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "100px 24px 80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--accent-light)",
            color: "#818cf8",
            fontSize: "12px",
            fontWeight: "600",
            padding: "5px 14px",
            borderRadius: "20px",
            marginBottom: "28px",
            border: "1px solid rgba(99,102,241,0.2)",
            letterSpacing: "0.5px",
          }}
        >
          📡 AI-powered VC portfolio intelligence
        </div>
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: "800",
            letterSpacing: "-2px",
            lineHeight: "1.05",
            marginBottom: "24px",
            color: "var(--text-primary)",
          }}
        >
          Know your portfolio&apos;s{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            pulse
          </span>
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "var(--text-secondary)",
            lineHeight: "1.7",
            marginBottom: "40px",
            maxWidth: "520px",
            margin: "0 auto 40px",
          }}
        >
          Upload your portfolio data and get AI-powered forecasting, anomaly
          detection, and natural language insights — in seconds.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/dashboard"
            style={{
              fontSize: "15px",
              fontWeight: "600",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              padding: "14px 32px",
              borderRadius: "12px",
              textDecoration: "none",
              boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
            }}
          >
            Upload portfolio →
          </Link>
          <Link
            href="#features"
            style={{
              fontSize: "15px",
              fontWeight: "600",
              color: "var(--text-secondary)",
              padding: "14px 32px",
              borderRadius: "12px",
              textDecoration: "none",
              border: "1px solid var(--border)",
            }}
          >
            See features
          </Link>
        </div>
      </section>

      {/* Tech strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "32px",
          padding: "20px 48px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          flexWrap: "wrap",
        }}
      >
        {[
          "Prophet",
          "Isolation Forest",
          "KMeans",
          "OpenAI",
          "FastAPI",
          "Next.js 15",
          "PostgreSQL",
        ].map((tech) => (
          <span
            key={tech}
            style={{
              fontSize: "12px",
              color: "var(--text-tertiary)",
              fontWeight: "500",
              letterSpacing: "0.5px",
            }}
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Features */}
      <section
        id="features"
        style={{ padding: "96px 48px", maxWidth: "1100px", margin: "0 auto" }}
      >
        <h2
          style={{
            fontSize: "36px",
            fontWeight: "800",
            letterSpacing: "-1px",
            textAlign: "center",
            marginBottom: "14px",
          }}
        >
          Everything you need to monitor your portfolio
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            textAlign: "center",
            marginBottom: "64px",
          }}
        >
          ML-powered insights that surface problems before they become crises
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "28px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  background: "var(--accent-light)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  marginBottom: "16px",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.6",
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: "80px 48px",
          textAlign: "center",
          borderTop: "1px solid var(--border)",
        }}
      >
        <h2
          style={{
            fontSize: "32px",
            fontWeight: "800",
            letterSpacing: "-1px",
            marginBottom: "12px",
          }}
        >
          Ready to check your portfolio&apos;s pulse?
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            marginBottom: "32px",
          }}
        >
          Upload a CSV and get insights in under 60 seconds.
        </p>
        <Link
          href="/dashboard"
          style={{
            fontSize: "15px",
            fontWeight: "600",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white",
            padding: "14px 32px",
            borderRadius: "12px",
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
          }}
        >
          Get started free →
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "24px 48px",
          borderTop: "1px solid var(--border)",
          textAlign: "center",
          fontSize: "13px",
          color: "var(--text-tertiary)",
        }}
      >
        PulseVC — built by{" "}
        <a
          href="https://github.com/iamgaurav07"
          style={{ color: "var(--accent)", textDecoration: "none" }}
        >
          @iamgaurav07
        </a>
      </footer>
    </div>
  );
}
