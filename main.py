"""
Apalabrados Master Bot — Backend
FastAPI server que sirve el frontend estático y expone
el punto de montaje de archivos para evitar bloqueos CORS.
"""

import os
import json
import uvicorn
import stripe
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

# ── FIREBASE ADMIN ────────────────────────────────────────────────────────────
# En Railway usaremos la variable de entorno FIREBASE_SERVICE_ACCOUNT (JSON string)
cred_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
if cred_json:
    try:
        cred_dict = json.loads(cred_json)
        cred = credentials.Certificate(cred_dict)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase Admin inicializado")
    except Exception as e:
        print(f"❌ Error al inicializar Firebase Admin: {e}")

# ── STRIPE ────────────────────────────────────────────────────────────────────
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")

# ── APP ───────────────────────────────────────────────────────────────────────
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

# ── WEBHOOK ───────────────────────────────────────────────────────────────────
@app.post("/webhook/stripe")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    if not webhook_secret:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, webhook_secret)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Manejar el evento de pago exitoso
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        client_reference_id = session.get('client_reference_id') # User UID de Firebase
        
        if client_reference_id:
            db = firestore.client()
            db.collection('users').document(client_reference_id).update({
                'is_premium': True,
                'premium_purchased_at': firestore.SERVER_TIMESTAMP,
                'stripe_session_id': session.get('id')
            })
            print(f"💰 ¡Pago recibido! Usuario {client_reference_id} ahora es PREMIUM")

    return {"status": "success"}

# ── ESTÁTICOS ─────────────────────────────────────────────────────────────────
app.mount("/", StaticFiles(directory=".", html=True), name="static")

# ── ENTRYPOINT ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Railway inyecta $PORT automáticamente. En local, usa 8000.
    port = int(os.environ.get("PORT", 8000))
    is_local = port == 8000
    print(f"🟢  Apalabrados Master Bot arrancando en http://localhost:{port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=is_local)
