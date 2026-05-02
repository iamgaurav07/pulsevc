from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import chat, upload, forecast, anomaly


load_dotenv()

app = FastAPI(
    title="PulseVC API",
    description="API for PulseVC, a voice conversion model.",
    version="1.0.0",
)

# Allow Next.js frontend to talk to FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.railway.app"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# register routers
app.include_router(upload.router)
app.include_router(forecast.router)
app.include_router(anomaly.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {
        "message": "PulseVC API is running!",
        "version": "1.0.0"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }