"""
Apalabrados Master Bot — Backend
FastAPI server que sirve el frontend estático y expone
el punto de montaje de archivos para evitar bloqueos CORS.
"""

import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Apalabrados Master Bot",
    description="Motor de análisis y sugerencias para Apalabrados/Scrabble en español.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ESTÁTICOS ─────────────────────────────────────────────────────────────────
app.mount("/", StaticFiles(directory=".", html=True), name="static")

# ── ENTRYPOINT ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Railway inyecta $PORT automáticamente. En local, usa 8000.
    port = int(os.environ.get("PORT", 8000))
    is_local = port == 8000
    print(f"🟢  Apalabrados Master Bot arrancando en http://localhost:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=is_local)
