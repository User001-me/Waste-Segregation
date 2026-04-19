"""
Hugging Face Spaces entry point.
HF Spaces runs this file automatically.
Place best.pt in the same directory before deploying.
"""
import os
os.environ.setdefault("MODEL_PATH", "best.pt")

# HF Spaces uses port 7860
import uvicorn
from main import app

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
