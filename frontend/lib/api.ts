import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

// Upload CSV
export const uploadCSV = async (file: File, portfolioName: string) => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("portfolio_name", portfolioName)
  const res = await api.post("/upload/csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return res.data
}

// Get portfolios
export const getPortfolios = async () => {
  const res = await api.get("/upload/portfolios")
  return res.data
}

// Get portfolio details
export const getPortfolio = async (id: string) => {
  const res = await api.get(`/upload/portfolio/${id}`)
  return res.data
}

// Get forecast
export const getForecast = async (portfolioId: string) => {
  const res = await api.get(`/forecast/portfolio/${portfolioId}`)
  return res.data
}

// Get anomaly analysis
export const getAnomalyAnalysis = async (portfolioId: string) => {
  const res = await api.get(`/analysis/anomaly/${portfolioId}`)
  return res.data
}

// Get clustering
export const getClustering = async (portfolioId: string) => {
  const res = await api.get(`/analysis/clustering/${portfolioId}`)
  return res.data
}

// Ask question
export const askQuestion = async (portfolioId: string, question: string) => {
  const res = await api.post("/chat/ask", { portfolio_id: portfolioId, question })
  return res.data
}