"""
WasteAI — Folder Image Detection
Detects waste in all images in a folder
Results saved to output/ folder

Run: python detect_folder.py
     python detect_folder.py --input my_photos --conf 0.4
"""

import cv2
import os
import argparse
import time
from pathlib import Path
from ultralytics import YOLO

# ── Config ────────────────────────────────
MODEL_PATH  = "best.pt"
INPUT_DIR   = "input"     # put your images here
OUTPUT_DIR  = "output"    # results saved here
CONF        = 0.35
EXTENSIONS  = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".heic"}
# ─────────────────────────────────────────

CLASS_NAMES = [
    "organic", "paper", "cardboard", "fabric", "clothes",
    "leather", "rubber", "wood", "shoe", "diaper",
    "hazardous", "cigarette_butt", "e_waste",
    "injection_vial", "iv_fluid_bottle", "blood_contaminated",
    "sharp_instruments", "syringe", "gloves_masks", "biomedical",
    "plastic", "glass", "metal"
]

GROUP_MAP = {
    "organic":"msw","paper":"msw","cardboard":"msw","fabric":"msw",
    "clothes":"msw","leather":"msw","rubber":"msw","wood":"msw",
    "shoe":"msw","diaper":"msw",
    "hazardous":"haz","cigarette_butt":"haz",
    "e_waste":"ewaste",
    "injection_vial":"bio","iv_fluid_bottle":"bio",
    "blood_contaminated":"bio","sharp_instruments":"bio",
    "syringe":"bio","gloves_masks":"bio","biomedical":"bio",
    "plastic":"plastic",
    "glass":"cnd","metal":"cnd",
}

GROUP_LABELS = {
    "msw":     "Municipal Solid Waste",
    "haz":     "Hazardous Waste",
    "ewaste":  "E-Waste",
    "bio":     "Bio-medical Waste",
    "plastic": "Plastic Waste",
    "cnd":     "Construction & Demolition",
}

COLORS = {
    "msw":     (74,  222, 128),
    "haz":     (36,  191, 251),
    "ewaste":  (250, 139, 167),
    "bio":     (113, 113, 248),
    "plastic": (250, 165,  96),
    "cnd":     ( 60, 146, 251),
}

DISPOSAL = {
    "organic":            "Compost bin / Green bin",
    "paper":              "Recycling bin — clean & dry",
    "cardboard":          "Recycling bin — flatten first",
    "fabric":             "Textile recycling point",
    "clothes":            "Textile recycling / donation",
    "leather":            "Specialised recycling",
    "rubber":             "Rubber recycling facility",
    "wood":               "Wood recycling / green waste",
    "shoe":               "Shoe recycling point",
    "diaper":             "Sealed bag → general waste",
    "hazardous":          "Hazardous waste facility only",
    "cigarette_butt":     "Cigarette bin — never litter",
    "e_waste":            "E-waste drop-off centre",
    "injection_vial":     "Sharps container → biomedical facility",
    "iv_fluid_bottle":    "Biomedical waste bag",
    "blood_contaminated": "Red biomedical bag — sealed",
    "sharp_instruments":  "Sharps container immediately",
    "syringe":            "Sharps container immediately",
    "gloves_masks":       "Yellow biomedical bag",
    "biomedical":         "Authorised biomedical disposal",
    "plastic":            "Recycling bin — rinse first",
    "glass":              "Glass recycling bin",
    "metal":              "Metal recycling bin",
}


def draw_detections(frame, results):
    detections = []
    for result in results:
        if result.boxes is None:
            continue
        for box in result.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf   = float(box.conf[0])
            cls_id = int(box.cls[0])
            name   = CLASS_NAMES[cls_id] if cls_id < len(CLASS_NAMES) else "unknown"
            group  = GROUP_MAP.get(name, "msw")
            color  = COLORS[group]

            detections.append({
                "class": name, "confidence": conf,
                "group": GROUP_LABELS[group],
                "disposal": DISPOSAL.get(name, "Follow local guidelines"),
                "bbox": [x1, y1, x2, y2]
            })

            # Bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

            # Label background + text
            label = f"{name}  {conf:.0%}"
            (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
            cv2.rectangle(frame, (x1, y1-lh-10), (x1+lw+6, y1), color, -1)
            bright = 0.114*color[0] + 0.587*color[1] + 0.299*color[2]
            tc = (0, 0, 0) if bright > 128 else (255, 255, 255)
            cv2.putText(frame, label, (x1+3, y1-4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, tc, 2)

    return frame, detections


def draw_summary_panel(frame, detections, filename, elapsed):
    """Draw summary panel at bottom of image."""
    h, w = frame.shape[:2]
    panel_h = min(30 + len(detections) * 22 + 30, 200)

    # Dark panel background
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, h - panel_h), (w, h), (15, 20, 15), -1)
    cv2.addWeighted(overlay, 0.85, frame, 0.15, 0, frame)

    # Header
    header = f"WasteAI  |  {filename}  |  {len(detections)} detection(s)  |  {elapsed:.2f}s"
    cv2.putText(frame, header, (10, h - panel_h + 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (150, 200, 150), 1)

    # Each detection
    for i, det in enumerate(detections[:6]):  # max 6 shown
        y = h - panel_h + 44 + i * 22
        group  = next(k for k, v in GROUP_LABELS.items() if v == det["group"])
        color  = COLORS.get(group, (150, 200, 150))
        text   = f"  {det['class'].replace('_',' ')}  {det['confidence']:.0%}  —  {det['disposal']}"
        cv2.putText(frame, text, (10, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, color, 1)

    return frame


def save_txt_report(detections, out_txt_path, filename):
    """Save a plain text report alongside the annotated image."""
    with open(out_txt_path, "w") as f:
        f.write(f"WasteAI Detection Report\n")
        f.write(f"{'='*50}\n")
        f.write(f"File   : {filename}\n")
        f.write(f"Objects: {len(detections)}\n\n")
        for i, det in enumerate(detections, 1):
            f.write(f"[{i}] {det['class'].replace('_',' ').title()}\n")
            f.write(f"    Confidence : {det['confidence']:.1%}\n")
            f.write(f"    Group      : {det['group']}\n")
            f.write(f"    Disposal   : {det['disposal']}\n")
            f.write(f"    BBox       : {det['bbox']}\n\n")


def process_folder(input_dir, output_dir, model, conf):
    input_path  = Path(input_dir)
    output_path = Path(output_dir)

    # Create output subfolders
    (output_path / "annotated").mkdir(parents=True, exist_ok=True)
    (output_path / "reports").mkdir(parents=True, exist_ok=True)

    # Collect images
    images = [
        f for f in input_path.iterdir()
        if f.suffix.lower() in EXTENSIONS
    ]

    if not images:
        print(f"❌  No images found in '{input_dir}/'")
        print(f"    Supported: {', '.join(EXTENSIONS)}")
        return

    print(f"\n📁 Input  : {input_dir}/")
    print(f"📁 Output : {output_dir}/annotated/ + {output_dir}/reports/")
    print(f"🖼️  Images : {len(images)} found")
    print(f"🎯 Conf   : {conf}\n")
    print("-" * 55)

    total_detections = 0
    summary = []

    for i, img_path in enumerate(sorted(images), 1):
        frame = cv2.imread(str(img_path))
        if frame is None:
            print(f"  [{i}/{len(images)}] ⚠️  Skipped (unreadable): {img_path.name}")
            continue

        t0 = time.time()
        results  = model.predict(frame, conf=conf, verbose=False)
        elapsed  = time.time() - t0

        annotated, detections = draw_detections(frame, results)
        annotated = draw_summary_panel(annotated, detections, img_path.name, elapsed)

        # Save annotated image
        out_img  = output_path / "annotated" / img_path.name
        out_txt  = output_path / "reports"   / (img_path.stem + ".txt")
        cv2.imwrite(str(out_img), annotated)
        save_txt_report(detections, out_txt, img_path.name)

        total_detections += len(detections)
        summary.append((img_path.name, len(detections)))

        classes = [d["class"].replace("_", " ") for d in detections]
        cls_str = ", ".join(classes) if classes else "none"
        print(f"  [{i:2}/{len(images)}] ✅ {img_path.name:<35} {len(detections)} obj → {cls_str}")

    # Final summary
    print("-" * 55)
    print(f"\n✅  Done!")
    print(f"   Images processed : {len(images)}")
    print(f"   Total detections : {total_detections}")
    print(f"   Annotated images : {output_dir}/annotated/")
    print(f"   Text reports     : {output_dir}/reports/")

    # Top detections summary
    if summary:
        most = max(summary, key=lambda x: x[1])
        print(f"\n   Most detections  : {most[0]} ({most[1]} objects)")


def main():
    parser = argparse.ArgumentParser(description="WasteAI Folder Detection")
    parser.add_argument("--input",  default=INPUT_DIR,  help="Input folder with images")
    parser.add_argument("--output", default=OUTPUT_DIR, help="Output folder for results")
    parser.add_argument("--model",  default=MODEL_PATH, help="Path to best.pt")
    parser.add_argument("--conf",   default=CONF, type=float, help="Confidence threshold")
    args = parser.parse_args()

    print(f"\n🤖 Loading model: {args.model}")
    model = YOLO(args.model)
    print(f"✅ Model loaded — {len(CLASS_NAMES)} classes\n")

    process_folder(args.input, args.output, model, args.conf)


if __name__ == "__main__":
    main()
