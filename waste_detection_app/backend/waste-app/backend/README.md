# WasteAI Backend

FastAPI backend serving YOLOv8m waste detection model.

## Setup (Local)

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set ADMIN_PASSWORD
# Place your best.pt in this folder
python main.py
```

API runs at: http://localhost:8000
Swagger docs: http://localhost:8000/docs

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /predict | Upload image → get detections |
| POST | /feedback | Submit correction for wrong prediction |
| POST | /admin/login | Get admin token |
| GET | /admin/stats | Dashboard stats |
| GET | /admin/feedback | Pending feedback queue |
| POST | /admin/feedback/{id}/approve | Approve correction |
| POST | /admin/feedback/{id}/reject | Reject correction |
| POST | /admin/retrain | Trigger model retraining |
| GET | /admin/model | Model info |

## Deploy to Hugging Face Spaces

1. Create new Space: huggingface.co/new-space
   - SDK: Gradio (but we override with FastAPI)
   - Actually select "Docker" SDK

2. Create Dockerfile:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 7860
CMD ["python", "app.py"]
```

3. Upload all files including best.pt
4. Set env vars in Space settings:
   - ADMIN_PASSWORD=your_secure_password
   - MODEL_PATH=best.pt

5. Your API will be at:
   https://your-username-waste-detection.hf.space

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| MODEL_PATH | best.pt | Path to YOLOv8 weights |
| CONF_THRESH | 0.35 | Detection confidence threshold |
| IOU_THRESH | 0.45 | NMS IoU threshold |
| ADMIN_PASSWORD | admin123 | Admin panel password |
| DATABASE_URL | sqlite:///waste_ai.db | Database connection |
