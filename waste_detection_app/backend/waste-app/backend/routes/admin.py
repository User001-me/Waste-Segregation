import os
import asyncio
import secrets
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from database import (
    get_stats, get_pending_feedback, update_feedback_status,
    get_approved_count, bump_model_version
)

router  = APIRouter()
bearer  = HTTPBearer()

# ── Simple token auth ─────────────────────────────────────
# Set ADMIN_PASSWORD env var (default: "admin123" for dev)
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
# In-memory token store (fine for single-instance deployment)
_tokens: set = set()


def verify_token(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if creds.credentials not in _tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return creds.credentials


# ── Auth ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
async def admin_login(body: LoginRequest):
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect password")
    token = secrets.token_hex(32)
    _tokens.add(token)
    return {"token": token}


# ── Stats ─────────────────────────────────────────────────

@router.get("/stats")
async def admin_stats(token: str = Depends(verify_token)):
    return await get_stats()


# ── Feedback queue ────────────────────────────────────────

@router.get("/feedback")
async def list_feedback(token: str = Depends(verify_token)):
    items = await get_pending_feedback(limit=100)
    return {"feedback": items, "count": len(items)}


@router.post("/feedback/{feedback_id}/approve")
async def approve(feedback_id: int, token: str = Depends(verify_token)):
    await update_feedback_status(feedback_id, "approved")
    approved = await get_approved_count()
    return {
        "status": "approved",
        "approved_total": approved,
        "retrain_ready": approved >= 500,
    }


@router.post("/feedback/{feedback_id}/reject")
async def reject(feedback_id: int, token: str = Depends(verify_token)):
    await update_feedback_status(feedback_id, "rejected")
    return {"status": "rejected"}


# ── Retrain ───────────────────────────────────────────────

@router.post("/retrain")
async def trigger_retrain(token: str = Depends(verify_token)):
    approved = await get_approved_count()
    if approved < 500:
        raise HTTPException(
            status_code=400,
            detail=f"Need 500 approved corrections, only {approved} available."
        )

    # Bump version in DB
    new_version = await bump_model_version(notes=f"Retrain triggered with {approved} corrections")

    # In production: trigger your training pipeline here
    # e.g. call a Colab webhook, HuggingFace training job, etc.
    # For now we log it
    print(f"🔄 Retrain triggered! New model version: {new_version}")

    return {
        "status": "triggered",
        "new_version": new_version,
        "corrections_used": approved,
        "message": "Retraining has been triggered. Deploy new best.pt when complete."
    }


# ── Model info ────────────────────────────────────────────

@router.get("/model")
async def model_info(token: str = Depends(verify_token)):
    from model import MODEL_PATH, CLASS_NAMES, CONF_THRESH
    from pathlib import Path
    model_exists = Path(MODEL_PATH).exists()
    size_mb = round(Path(MODEL_PATH).stat().st_size / 1024 / 1024, 1) if model_exists else 0
    return {
        "model_path":   MODEL_PATH,
        "model_exists": model_exists,
        "size_mb":      size_mb,
        "num_classes":  len(CLASS_NAMES),
        "classes":      CLASS_NAMES,
        "conf_thresh":  CONF_THRESH,
    }
