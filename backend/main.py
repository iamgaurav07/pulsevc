from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import upload, forecast, anomaly, chat
from database import engine, Base
import models

load_dotenv()

# create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PulseVC API",
    description="AI-powered VC portfolio analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.render.com",
        "https://*.onrender.com",
        "https://pulsevc-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(forecast.router)
app.include_router(anomaly.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "PulseVC API is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}