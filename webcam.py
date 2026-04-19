"""
WasteAI — Live Webcam Detection
Run: python webcam.py
Press Q to quit
"""

import cv2
from ultralytics import YOLO

# ── Config ────────────────────────────────
MODEL_PATH = "best.pt"   # put best.pt in same folder
CONF       = 0.35
WEBCAM_ID  = 0           # 0 = default camera
# ─────────────────────────────────────────

CLASS_NAMES = [
    "organic", "paper", "cardboard", "fabric", "clothes",
    "leather", "rubber", "wood", "shoe", "diaper",
    "hazardous", "cigarette_butt", "e_waste",
    "injection_vial", "iv_fluid_bottle", "blood_contaminated",
    "sharp_instruments", "syringe", "gloves_masks", "biomedical",
    "plastic", "glass", "metal"
]

GROUP_COLORS = {
    "organic":"msw","paper":"msw","cardboard":"msw","fabric":"msw",
    "clothes":"msw","leather":"msw","rubber":"msw","wood":"msw",
    "shoe":"msw","diaper":"msw",
    "hazardous":"haz","cigarette_butt":"haz",
    "e_waste":"ewaste",
    "injection_vial":"bio","iv_fluid_bottle":"bio","blood_contaminated":"bio",
    "sharp_instruments":"bio","syringe":"bio","gloves_masks":"bio","biomedical":"bio",
    "plastic":"plastic",
    "glass":"cnd","metal":"cnd",
}

# BGR colors
COLORS = {
    "msw":     (74,  222, 128),
    "haz":     (36,  191, 251),
    "ewaste":  (250, 139, 167),
    "bio":     (113, 113, 248),
    "plastic": (250, 165,  96),
    "cnd":     ( 60, 146, 251),
}

model = YOLO(MODEL_PATH)
cap   = cv2.VideoCapture(WEBCAM_ID)
cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

print("✅ Model loaded! Press Q to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model.predict(frame, conf=CONF, verbose=False)

    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf   = float(box.conf[0])
            cls_id = int(box.cls[0])
            name   = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else "unknown"
            group  = GROUP_COLORS.get(name, "msw")
            color  = COLORS[group]

            # Box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

            # Label
            label = f"{name}  {conf:.0%}"
            (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.rectangle(frame, (x1, y1-lh-10), (x1+lw+6, y1), color, -1)
            bright = 0.114*color[0] + 0.587*color[1] + 0.299*color[2]
            tc = (0,0,0) if bright > 128 else (255,255,255)
            cv2.putText(frame, label, (x1+3, y1-4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, tc, 2)

    cv2.imshow("WasteAI — Press Q to quit", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()