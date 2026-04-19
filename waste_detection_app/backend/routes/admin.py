import os
import re
import shutil
import secrets
import tempfile
import zipfile
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from pydantic import BaseModel

from database import (
    get_stats, get_pending_feedback, update_feedback_status,
    get_approved_count, bump_model_version, get_feedback_by_id
)

router = APIRouter()
bearer = HTTPBearer()

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
APP_DATA_DIR = Path(os.getenv("APP_DATA_DIR", ".")).resolve()
FEEDBACK_IMG_DIR = APP_DATA_DIR / "feedback_images"
APPROVED_DATA_DIR = APP_DATA_DIR / "feedback_dataset"
NEW_CLASSES_DIR = Path(APPROVED_DATA_DIR) / "new_classes"
_tokens: set = set()

os.makedirs(f"{APPROVED_DATA_DIR}/images", exist_ok=True)
os.makedirs(f"{APPROVED_DATA_DIR}/labels", exist_ok=True)
os.makedirs(NEW_CLASSES_DIR, exist_ok=True)

CLASS_NAMES = [
    "organic", "paper", "cardboard", "fabric", "clothes",
    "leather", "rubber", "wood", "shoe", "diaper",
    "hazardous", "cigarette_butt", "e_waste",
    "injection_vial", "iv_fluid_bottle", "blood_contaminated",
    "sharp_instruments", "syringe", "gloves_masks", "biomedical",
    "plastic", "glass", "metal"
]


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9_\- ]+", "", value)
    value = re.sub(r"[\s\-]+", "_", value)
    return value or "unnamed"


def verify_token(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if creds.credentials not in _tokens:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return creds.credentials


class LoginRequest(BaseModel):
    password: str


@router.post("/login")
async def admin_login(body: LoginRequest):
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Incorrect password")
    token = secrets.token_hex(32)
    _tokens.add(token)
    return {"token": token}


@router.get("/stats")
async def admin_stats(token: str = Depends(verify_token)):
    return await get_stats()


@router.get("/feedback")
async def list_feedback(token: str = Depends(verify_token)):
    items = await get_pending_feedback(limit=100)
    return {"feedback": items, "count": len(items)}


@router.get("/feedback/export")
async def export_feedback_dataset(token: str = Depends(verify_token)):
    if not APPROVED_DATA_DIR.exists():
        raise HTTPException(status_code=404, detail="No feedback dataset found yet")

    has_files = any(path.is_file() for path in APPROVED_DATA_DIR.rglob("*"))
    if not has_files:
        raise HTTPException(status_code=404, detail="No approved feedback files found yet")

    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    temp_path = Path(temp.name)
    temp.close()

    with zipfile.ZipFile(temp_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in APPROVED_DATA_DIR.rglob("*"):
            if path.is_file():
                archive.write(path, path.relative_to(APPROVED_DATA_DIR.parent))

    return FileResponse(
        path=temp_path,
        filename="wasteai-approved-feedback-dataset.zip",
        media_type="application/zip",
    )


@router.post("/feedback/{feedback_id}/approve")
async def approve(feedback_id: int, token: str = Depends(verify_token)):
    feedback = await get_feedback_by_id(feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    image_url = feedback.get("image_url") or ""
    if image_url:
        src = image_url.lstrip("/")
        img_filename = os.path.basename(src)
        if os.path.exists(src):
            if feedback.get("new_class_name"):
                target_dir = NEW_CLASSES_DIR / slugify(feedback["new_class_name"])
                target_dir.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, target_dir / img_filename)
            elif feedback.get("correct_class") in CLASS_NAMES:
                dst_img = f"{APPROVED_DATA_DIR}/images/{img_filename}"
                shutil.copy2(src, dst_img)

                cls_idx = CLASS_NAMES.index(feedback["correct_class"])
                label_filename = img_filename.rsplit(".", 1)[0] + ".txt"
                label_path = f"{APPROVED_DATA_DIR}/labels/{label_filename}"
                with open(label_path, "w", encoding="utf-8") as handle:
                    handle.write(f"{cls_idx} 0.5 0.5 1.0 1.0\n")

    await update_feedback_status(feedback_id, "approved")
    approved = await get_approved_count()

    return {
        "status": "approved",
        "approved_total": approved,
        "retrain_ready": approved >= 500,
        "message": f"Feedback approved. ({approved}/500 corrections)"
    }


@router.post("/feedback/{feedback_id}/reject")
async def reject(feedback_id: int, token: str = Depends(verify_token)):
    feedback = await get_feedback_by_id(feedback_id)
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if feedback.get("image_url"):
        src = feedback["image_url"].lstrip("/")
        if os.path.exists(src):
            os.remove(src)
            print(f"Deleted rejected image: {src}")

    await update_feedback_status(feedback_id, "rejected")

    return {
        "status": "rejected",
        "message": "Image deleted from disk."
    }


@router.post("/retrain")
async def trigger_retrain(token: str = Depends(verify_token)):
    approved = await get_approved_count()
    if approved < 500:
        raise HTTPException(
            status_code=400,
            detail=f"Need 500 approved corrections, only {approved} available."
        )
    new_version = await bump_model_version(
        notes=f"Retrain triggered with {approved} corrections"
    )
    print(f"Retrain triggered! New model version: {new_version}")
    return {
        "status": "triggered",
        "new_version": new_version,
        "corrections_used": approved,
        "message": "Retraining triggered. Deploy new best.pt when complete."
    }


@router.get("/model")
async def model_info(token: str = Depends(verify_token)):
    from model import MODEL_PATH, CLASS_NAMES, CONF_THRESH

    model_exists = Path(MODEL_PATH).exists()
    size_mb = round(Path(MODEL_PATH).stat().st_size / 1024 / 1024, 1) if model_exists else 0
    return {
        "model_path": MODEL_PATH,
        "model_exists": model_exists,
        "size_mb": size_mb,
        "num_classes": len(CLASS_NAMES),
        "classes": CLASS_NAMES,
        "conf_thresh": CONF_THRESH,
    }
