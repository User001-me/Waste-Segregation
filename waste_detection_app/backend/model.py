import os
import base64
import uuid
from pathlib import Path
from ultralytics import YOLO
import numpy as np
import cv2

# ── Config ────────────────────────────────────────────────
MODEL_PATH  = os.getenv("MODEL_PATH", "best.pt")
CONF_THRESH = float(os.getenv("CONF_THRESH", "0.35"))
IOU_THRESH  = float(os.getenv("IOU_THRESH", "0.45"))

CLASS_NAMES = [
    "organic", "paper", "cardboard", "fabric", "clothes",
    "leather", "rubber", "wood", "shoe", "diaper",
    "hazardous", "cigarette_butt", "e_waste",
    "injection_vial", "iv_fluid_bottle", "blood_contaminated",
    "sharp_instruments", "syringe", "gloves_masks", "biomedical",
    "plastic", "glass", "metal"
]

GROUP_MAP = {
    "organic": "Municipal Solid Waste",
    "paper": "Municipal Solid Waste",
    "cardboard": "Municipal Solid Waste",
    "fabric": "Municipal Solid Waste",
    "clothes": "Municipal Solid Waste",
    "leather": "Municipal Solid Waste",
    "rubber": "Municipal Solid Waste",
    "wood": "Municipal Solid Waste",
    "shoe": "Municipal Solid Waste",
    "diaper": "Municipal Solid Waste",
    "hazardous": "Hazardous Waste",
    "cigarette_butt": "Hazardous Waste",
    "e_waste": "E-Waste",
    "injection_vial": "Bio-medical Waste",
    "iv_fluid_bottle": "Bio-medical Waste",
    "blood_contaminated": "Bio-medical Waste",
    "sharp_instruments": "Bio-medical Waste",
    "syringe": "Bio-medical Waste",
    "gloves_masks": "Bio-medical Waste",
    "biomedical": "Bio-medical Waste",
    "plastic": "Plastic Waste",
    "glass": "Construction & Demolition",
    "metal": "Construction & Demolition",
}

# Colour per group (BGR for OpenCV)
GROUP_COLORS = {
    "Municipal Solid Waste":     (74,  222, 128),
    "Hazardous Waste":           (36,  191, 251),
    "E-Waste":                   (250, 139, 167),
    "Bio-medical Waste":         (113, 113, 248),
    "Plastic Waste":             (250, 165,  96),
    "Construction & Demolition": (60,  146, 251),
}

_model = None

def load_model():
    global _model
    if not Path(MODEL_PATH).exists():
        print(f"⚠️  Model not found at {MODEL_PATH} — download best.pt and place it here")
        return
    _model = YOLO(MODEL_PATH)
    print(f"✅ Model loaded: {MODEL_PATH}")

def get_model():
    global _model
    if _model is None:
        load_model()
    return _model


def run_inference(image_bytes: bytes) -> dict:
    """
    Run YOLOv8 inference on raw image bytes.
    Returns detections + base64 annotated image.
    """
    model = get_model()

    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "Could not decode image", "detections": []}

    h, w = img.shape[:2]

    if model is None:
        # Return mock response for testing without model
        return {
            "prediction_id": str(uuid.uuid4()),
            "detections": [],
            "annotated_image": None,
            "image_size": {"width": w, "height": h},
            "model_version": 1,
        }

    # Run inference
    results = model.predict(
        img,
        conf=CONF_THRESH,
        iou=IOU_THRESH,
        verbose=False,
    )

    detections = []
    annotated  = img.copy()

    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf   = float(box.conf[0])
            cls_id = int(box.cls[0])

            if cls_id >= len(CLASS_NAMES):
                continue

            cls_name = CLASS_NAMES[cls_id]
            group    = GROUP_MAP.get(cls_name, "Municipal Solid Waste")
            color    = GROUP_COLORS.get(group, (74, 222, 128))

            detections.append({
                "class":      cls_name,
                "confidence": round(conf, 4),
                "group":      group,
                "bbox":       [x1, y1, x2, y2],
            })

            # Draw bbox
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

            # Label background
            label = f"{cls_name}  {conf:.0%}"
            (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.rectangle(annotated, (x1, y1 - lh - 10), (x1 + lw + 6, y1), color, -1)

            # Brightness check for text colour
            brightness = 0.114 * color[0] + 0.587 * color[1] + 0.299 * color[2]
            txt_color  = (0, 0, 0) if brightness > 128 else (255, 255, 255)
            cv2.putText(annotated, label, (x1 + 3, y1 - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, txt_color, 2)

    # Sort by confidence
    detections.sort(key=lambda d: d["confidence"], reverse=True)

    # Encode annotated image to base64
    _, buf      = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
    b64_image   = base64.b64encode(buf).decode("utf-8")

    return {
        "prediction_id":  str(uuid.uuid4()),
        "detections":     detections,
        "annotated_image": b64_image,
        "image_size":     {"width": w, "height": h},
        "model_version":  1,
    }
