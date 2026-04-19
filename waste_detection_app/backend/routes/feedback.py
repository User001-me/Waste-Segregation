import os
import re
import uuid
import base64
from pathlib import Path

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database import save_feedback, get_approved_count

router = APIRouter()

APP_DATA_DIR = Path(os.getenv("APP_DATA_DIR", ".")).resolve()
FEEDBACK_IMG_DIR = APP_DATA_DIR / "feedback_images"
FEEDBACK_DATASET_DIR = APP_DATA_DIR / "feedback_dataset"
NEW_CLASSES_DIR = Path(FEEDBACK_DATASET_DIR) / "new_classes"
os.makedirs(FEEDBACK_IMG_DIR, exist_ok=True)
os.makedirs(FEEDBACK_DATASET_DIR, exist_ok=True)
os.makedirs(NEW_CLASSES_DIR, exist_ok=True)


class AnnotationItem(BaseModel):
    bbox: list[float] = Field(default_factory=list)
    class_name: str | None = None
    class_: str | None = Field(default=None, alias="class")

    model_config = {
        "populate_by_name": True,
    }

    @property
    def label(self) -> str:
        return (self.class_name or self.class_ or "").strip()


class FeedbackRequest(BaseModel):
    prediction_id: str | None = None
    predicted_class: str = ""
    correct_class: str
    image_base64: str = ""
    new_class_name: str = ""
    new_class_description: str = ""
    annotations: list[AnnotationItem] = Field(default_factory=list)


VALID_CLASSES = [
    "organic", "paper", "cardboard", "fabric", "clothes",
    "leather", "rubber", "wood", "shoe", "diaper",
    "hazardous", "cigarette_butt", "e_waste",
    "injection_vial", "iv_fluid_bottle", "blood_contaminated",
    "sharp_instruments", "syringe", "gloves_masks", "biomedical",
    "plastic", "glass", "metal"
]
ALLOWED_CORRECT_CLASSES = set(VALID_CLASSES + ["__new_class__", "annotated"])


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9_\- ]+", "", value)
    value = re.sub(r"[\s\-]+", "_", value)
    return value or "unnamed"


def decode_base64_image(image_base64: str):
    raw = image_base64.split(",", 1)[-1]
    img_data = base64.b64decode(raw)
    array = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Could not decode image data")
    return img_data, image


def save_annotations(image, annotations: list[AnnotationItem]):
    saved = []
    height, width = image.shape[:2]

    for item in annotations:
        label = item.label
        if label not in VALID_CLASSES:
            continue
        if len(item.bbox) != 4:
            continue

        x1, y1, x2, y2 = [int(round(v)) for v in item.bbox]
        x1 = max(0, min(x1, width - 1))
        y1 = max(0, min(y1, height - 1))
        x2 = max(x1 + 1, min(x2, width))
        y2 = max(y1 + 1, min(y2, height))
        crop = image[y1:y2, x1:x2]
        if crop.size == 0:
            continue

        class_dir = Path(FEEDBACK_DATASET_DIR) / label
        images_dir = class_dir / "images"
        labels_dir = class_dir / "labels"
        images_dir.mkdir(parents=True, exist_ok=True)
        labels_dir.mkdir(parents=True, exist_ok=True)

        file_stem = str(uuid.uuid4())
        image_path = images_dir / f"{file_stem}.jpg"
        label_path = labels_dir / f"{file_stem}.txt"
        cv2.imwrite(str(image_path), crop)
        with open(label_path, "w", encoding="utf-8") as handle:
            handle.write("0 0.5 0.5 1.0 1.0\n")

        saved.append({
            "class": label,
            "bbox": [x1, y1, x2, y2],
            "image_path": str(image_path),
            "label_path": str(label_path),
        })

    return saved


@router.post("/feedback")
async def submit_feedback(body: FeedbackRequest):
    if body.correct_class not in ALLOWED_CORRECT_CLASSES:
        raise HTTPException(status_code=400, detail="Invalid class")

    if body.correct_class == "__new_class__" and not body.new_class_name.strip():
        raise HTTPException(status_code=400, detail="New class name is required")

    image_url = ""
    parsed_annotations = []

    image = None
    if body.image_base64:
        try:
            img_data, image = decode_base64_image(body.image_base64)
            img_name = f"{uuid.uuid4()}.jpg"
            img_path = FEEDBACK_IMG_DIR / img_name
            with open(img_path, "wb") as handle:
                handle.write(img_data)
            image_url = f"/feedback_images/{img_name}"

            if body.correct_class == "__new_class__":
                new_class_dir = NEW_CLASSES_DIR / slugify(body.new_class_name)
                new_class_dir.mkdir(parents=True, exist_ok=True)
                with open(new_class_dir / img_name, "wb") as handle:
                    handle.write(img_data)

            if body.annotations:
                parsed_annotations = save_annotations(image, body.annotations)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            print(f"Image save error: {exc}")
            raise HTTPException(status_code=500, detail="Could not save feedback image") from exc

    await save_feedback(
        prediction_id=body.prediction_id,
        predicted_class=body.predicted_class,
        correct_class=body.correct_class,
        image_url=image_url,
        new_class_name=slugify(body.new_class_name) if body.new_class_name else "",
        new_class_description=body.new_class_description.strip(),
        annotations=parsed_annotations,
    )

    approved = await get_approved_count()
    remaining = max(0, 500 - approved)

    return {
        "status": "saved",
        "message": "Correction saved!",
        "approved_count": approved,
        "retrain_in": remaining,
        "annotations_saved": len(parsed_annotations),
    }
