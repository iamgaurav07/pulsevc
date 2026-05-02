# PulseVC 📡

> AI-powered VC portfolio intelligence platform. Upload your portfolio data and get ML-driven forecasting, anomaly detection, and natural language insights.

🔗 **Live Demo**: https://pulsevc-frontend.onrender.com
🔗 **API Docs**: https://pulsevc-backend.onrender.com/docs
📂 **GitHub**: https://github.com/iamgaurav07/pulsevc

---

## Features

- 📊 **Portfolio Upload** — CSV import with automatic data parsing
- 📈 **Revenue Forecasting** — Prophet time series forecasting per company
- 🚨 **Anomaly Detection** — Isolation Forest flags unusual patterns
- 🔍 **Company Clustering** — KMeans groups similar companies
- 💬 **Natural Language Q&A** — Ask questions in plain English
- ⚡ **Real-time Alerts** — Critical runway and burn rate warnings

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Recharts |
| Backend | FastAPI, Python |
| ML | Prophet, scikit-learn, pandas, numpy |
| AI | OpenAI GPT-4o-mini |
| Database | PostgreSQL, SQLAlchemy |
| Deploy | Railway |

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop

### Installation

```bash
# Clone the repo
git clone https://github.com/iamgaurav07/pulsevc.git
cd pulsevc

# Start database
docker compose up -d

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_db.py
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Environment Variables

**Backend `.env`:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/pulsevc
OPENAI_API_KEY=your-openai-key
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Sample Data

Upload `backend/sample_data.csv` to test the platform with 3 sample companies.

## Architecture

```
┌─────────────────────────────────────────┐
│           Next.js 15 Frontend           │
│   Dashboard → Upload → Analysis → Chat  │
└──────────────────┬──────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────┐
│           FastAPI Backend               │
│  /upload  /forecast  /analysis  /chat   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│              PostgreSQL                 │
│  portfolios  companies  metrics         │
└─────────────────────────────────────────┘
```

## Roadmap

- [ ] Authentication
- [ ] Real stock data via Yahoo Finance API
- [ ] PDF report generation
- [ ] Email alerts for critical companies
- [ ] Multi-user support

## Built By

**Gaurav Kumar** — Full Stack Engineer
- 🌐 [LinkedIn](https://linkedin.com/in/iamgaurav1993)
- 🐙 [GitHub](https://github.com/iamgaurav07)
