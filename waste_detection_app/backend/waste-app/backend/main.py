from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from database import init_db
from routes.predict import router as predict_router
from routes.feedback import router as feedback_router
from routes.admin import router as admin_router
from model import load_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🔧 Initialising database...")
    await init_db()
    print("🤖 Loading YOLOv8 model...")
    load_model()
    print("✅ WasteAI backend ready!")
    yield
    # Shutdown
    print("👋 Shutting down...")

app = FastAPI(
    title="WasteAI API",
    description="Waste detection and segregation using YOLOv8m",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # restrict to your domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(feedback_router)
app.include_router(admin_router, prefix="/admin")

@app.get("/")
async def root():
    return {"status": "ok", "message": "WasteAI API is running 🚀"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
