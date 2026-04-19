from fastapi import APIRouter, UploadFile, File, HTTPException
from model import run_inference
from database import save_prediction

router = APIRouter()

MAX_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Run waste detection on an uploaded image.
    Returns detections with class, confidence, group, bbox + base64 annotated image.
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()

    if len(image_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Image too large (max 10MB)")

    result = run_inference(image_bytes)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    # Persist prediction to DB (fire and forget)
    try:
        await save_prediction(
            prediction_id=result["prediction_id"],
            detections=result["detections"],
            model_version=result.get("model_version", 1),
        )
    except Exception as e:
        print(f"Warning: Could not save prediction — {e}")

    return result
