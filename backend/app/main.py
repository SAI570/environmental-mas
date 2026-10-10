"""
main.py

FastAPI Application Entry Point.
Self-Organizing Multi-Agent Systems for Decentralized Environmental Monitoring.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.init_db import init_db
from app.api.routes import router
from app.core.simulation import simulation


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    print("[*] Starting MAS Environmental Monitoring Backend...")
    init_db()

    # Verify AI Anomaly Detector model
    if simulation.detector.is_model_loaded():
        print(f"[✓] AI Isolation Forest model loaded from: {simulation.detector.model_path}")
    else:
        print("[!] AI Model not found on disk. Operating on heuristic fallback until train_model.py is executed.")

    yield

    # Shutdown sequence
    print("[*] Shutting down MAS Backend...")


app = FastAPI(
    title="Self-Organizing Multi-Agent Systems for Decentralized Environmental Monitoring",
    description="Autonomous environmental sensing, AI anomaly detection, local consensus, and self-organizing recovery.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
if "*" not in origins:
    origins.append("http://localhost:3000")
    origins.append("http://127.0.0.1:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local frontend requests from any port during dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Router
app.include_router(router)


@app.get("/")
def root():
    return {
        "project": "Self-Organizing Multi-Agent Systems for Decentralized Environmental Monitoring",
        "author": "B.Tech Computer Science Final Project",
        "status": "ONLINE",
        "documentation": "/docs",
        "api_prefix": "/api"
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
