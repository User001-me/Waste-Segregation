from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import save_feedback, get_approved_count

router = APIRouter()

class FeedbackRequest(BaseModel):
    prediction_id: str
    predicted_class: str = ""
    correct_class: str

VALID_CLASSES = [
    "organic", "paper", "cardboard", "fabric", "clothes",
    "leather", "rubber", "wood", "shoe", "diaper",
    "hazardous", "cigarette_butt", "e_waste",
    "injection_vial", "iv_fluid_bottle", "blood_contaminated",
    "sharp_instruments", "syringe", "gloves_masks", "biomedical",
    "plastic", "glass", "metal"
]

@router.post("/feedback")
async def submit_feedback(body: FeedbackRequest):
    """
    Submit a correction for a wrong prediction.
    Saves to DB for admin review.
    """
    if body.correct_class not in VALID_CLASSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid class. Must be one of: {VALID_CLASSES}"
        )

    try:
        await save_feedback(
            prediction_id=body.prediction_id,
            predicted_class=body.predicted_class,
            correct_class=body.correct_class,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Check how close to retrain threshold
    approved = await get_approved_count()
    remaining = max(0, 500 - approved)

    return {
        "status": "saved",
        "message": "Thank you! Your correction helps improve the model.",
        "approved_count": approved,
        "retrain_in": remaining,
    }
