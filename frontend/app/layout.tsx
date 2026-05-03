import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "./components/ThemeProvider"

export const metadata: Metadata = {
  title: "PulseVC — AI-powered portfolio intelligence",
  description: "Upload your VC portfolio and get ML-driven forecasting, anomaly detection, and natural language insights",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}