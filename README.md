# PulseVC 📡

> AI-powered VC portfolio intelligence platform. Upload your portfolio data and get ML-driven forecasting, anomaly detection, clustering, and natural language insights — in seconds.

🔗 **Live Demo**: https://pulsevc-frontend.onrender.com
🔗 **API Docs**: https://pulsevc-backend.onrender.com/docs
📂 **GitHub**: https://github.com/iamgaurav07/pulsevc

> ⚡ **Note**: Free tier — backend may take 30-60 seconds to wake up on first request.

---

## What is PulseVC?

PulseVC is a full-stack ML platform built for VC analysts and investors. Upload a CSV of your portfolio companies and get instant AI-powered insights — which companies are growing, which are at risk, and which will run out of runway in the next 6 months.

---

## Features

- 📊 **Portfolio Upload** — CSV import with automatic parsing of companies, metrics, and monthly data
- 📈 **Revenue Forecasting** — Facebook Prophet predicts next 6 months of revenue, ARR, and headcount with confidence bands
- 🚨 **Anomaly Detection** — Isolation Forest scores each company 0-100 and labels as Healthy / Watch / Danger
- 🔍 **Company Clustering** — KMeans automatically groups companies by similarity (High Growth, Needs Attention, Mature)
- 💬 **Natural Language Q&A** — Ask anything about your portfolio in plain English, powered by GPT-4o-mini
- 🔔 **Email Alerts** — Send critical company alerts directly to your inbox via Resend
- 📄 **PDF Report Export** — Generate a professional PDF report with company analysis and alerts
- 🔐 **GitHub Authentication** — Secure login via NextAuth v5
- 🌙 **Dark Mode** — Light and dark theme toggle
- 📱 **Mobile Responsive** — Works on all screen sizes

---

## ML Concepts Explained

| Feature | Algorithm | What it does |
|---|---|---|
| Forecasting | Facebook Prophet | Fits historical revenue data and extrapolates 6 months forward with uncertainty bands |
| Anomaly Detection | Isolation Forest | Randomly isolates data points — anomalies get isolated faster because they're outliers |
| Clustering | KMeans | Places K cluster centers and assigns each company to the nearest center iteratively |
| Q&A | GPT-4o-mini + RAG | Converts portfolio DB rows to text context, feeds to LLM for grounded answers |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Recharts |
| Backend | FastAPI, Python 3.11 |
| ML | Prophet, scikit-learn (Isolation Forest, KMeans), pandas, numpy |
| AI | OpenAI GPT-4o-mini |
| Database | PostgreSQL, SQLAlchemy |
| Auth | NextAuth.js v5 (GitHub OAuth) |
| Email | Resend |
| Deploy | Render (two separate services) |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Next.js 15 Frontend                   │
│   Landing → Login → Dashboard → Portfolio       │
│   Overview │ Forecast │ Anomaly │ Ask AI         │
└──────────────────┬──────────────────────────────┘
                   │ HTTP / REST
┌──────────────────▼──────────────────────────────┐
│           FastAPI Python Backend                 │
│                                                 │
│  /upload    → CSV parsing + PostgreSQL storage  │
│  /forecast  → Prophet time series forecasting   │
│  /analysis  → Isolation Forest + KMeans + Alerts│
│  /chat      → OpenAI Q&A with portfolio context │
└──────────────────┬──────────────────────────────┘
                   │ SQLAlchemy ORM
┌──────────────────▼──────────────────────────────┐
│              PostgreSQL                         │
│  portfolios │ companies │ company_metrics       │
│  analysis_results                               │
└─────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker Desktop
- OpenAI API key
- GitHub OAuth app
- Resend API key (for email alerts)

### Installation

```bash
# Clone the repo
git clone https://github.com/iamgaurav07/pulsevc.git
cd pulsevc

# Start database
docker compose up -d

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_db.py
uvicorn main:app --reload --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

---

## Environment Variables

**Backend `backend/.env`:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/pulsevc
OPENAI_API_KEY=your-openai-key
RESEND_API_KEY=your-resend-key
```

**Frontend `frontend/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
AUTH_SECRET=your-32-char-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## Sample Data

Upload `backend/sample_data.csv` to test with **5,355 rows across 215 companies** including:
- 27 sectors (SaaS, Fintech, Healthcare, AI/ML, CleanTech...)
- 14 countries across Europe
- Seed to Series C companies
- ~20% struggling companies with low runway
- ~15% high-growth companies (40-80% growth rate)
- Realistic burn rate spikes to trigger anomaly detection

---

## Project Structure

```
pulsevc/
├── frontend/                  ← Next.js 15 app
│   ├── app/
│   │   ├── page.tsx           ← Landing page
│   │   ├── dashboard/         ← Portfolio list + upload
│   │   ├── portfolio/[id]/    ← 4-tab analysis page
│   │   ├── login/             ← GitHub OAuth login
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── ThemeProvider.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── PDFReport.tsx
│   │   │   └── AlertModal.tsx
│   │   └── api/auth/          ← NextAuth handlers
│   ├── auth.ts                ← NextAuth config
│   └── middleware.ts          ← Route protection
│
├── backend/                   ← FastAPI Python service
│   ├── main.py                ← App entry point + CORS
│   ├── database.py            ← SQLAlchemy engine
│   ├── models.py              ← DB models
│   ├── init_db.py             ← Table creation
│   ├── ml/
│   │   ├── forecasting.py     ← Prophet
│   │   ├── anomaly.py         ← Isolation Forest
│   │   ├── clustering.py      ← KMeans
│   │   └── alerts.py          ← Resend email alerts
│   └── routers/
│       ├── upload.py          ← CSV upload + portfolio CRUD
│       ├── forecast.py        ← Forecast endpoints
│       ├── anomaly.py         ← Anomaly + clustering + alerts
│       └── chat.py            ← OpenAI Q&A
│
└── docker-compose.yml         ← Local Postgres + Redis
```

---

## Roadmap

- [ ] Demo video walkthrough
- [ ] Real stock data via Yahoo Finance API
- [ ] Scheduled weekly email reports
- [ ] Multi-user team workspaces
- [ ] Stripe billing for premium features
- [ ] Export to Excel

---

## Built By

**Gaurav Kumar** — Full Stack Engineer
- 🌐 [Live Demo](https://pulsevc-frontend.onrender.com)
- 💼 [LinkedIn](https://linkedin.com/in/iamgaurav1993)
- 🐙 [GitHub](https://github.com/iamgaurav07)
- 📧 iamgaurav1993@gmail.com

---

## License

MIT