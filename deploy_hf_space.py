from __future__ import annotations

import argparse
import os
from pathlib import Path

from huggingface_hub import HfApi, upload_folder


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Deploy WasteAI backend to a Hugging Face Docker Space.")
    parser.add_argument(
        "--repo-id",
        default="Gujjar0Sasuke/Waste-Segregation-backend",
        help="Target Hugging Face Space repo id.",
    )
    parser.add_argument(
        "--backend-dir",
        default="waste_detection_app/backend",
        help="Backend folder to upload.",
    )
    parser.add_argument(
        "--admin-password",
        default=os.getenv("WASTEAI_ADMIN_PASSWORD", "iitbhu2026"),
        help="Admin password to store as a Hugging Face Space secret. Can also use WASTEAI_ADMIN_PASSWORD.",
    )
    parser.add_argument(
        "--token",
        default=os.getenv("HF_TOKEN"),
        help="Hugging Face write token. Can also use HF_TOKEN.",
    )
    parser.add_argument(
        "--private",
        action="store_true",
        help="Create the Space as private instead of public.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    backend_dir = Path(args.backend_dir).resolve()
    if not backend_dir.exists():
        raise SystemExit(f"Backend folder not found: {backend_dir}")

    api = HfApi(token=args.token)
    print(f"[WasteAI] Creating or updating Space: {args.repo_id}")
    api.create_repo(
        repo_id=args.repo_id,
        repo_type="space",
        space_sdk="docker",
        private=args.private,
        exist_ok=True,
        token=args.token,
    )

    print("[WasteAI] Setting Space variable MODEL_PATH=best.pt")
    api.add_space_variable(repo_id=args.repo_id, key="MODEL_PATH", value="best.pt", token=args.token)

    print("[WasteAI] Setting Space secret ADMIN_PASSWORD")
    api.add_space_secret(repo_id=args.repo_id, key="ADMIN_PASSWORD", value=args.admin_password, token=args.token)

    print("[WasteAI] Uploading backend files...")
    upload_folder(
        repo_id=args.repo_id,
        repo_type="space",
        folder_path=backend_dir,
        token=args.token,
        commit_message="Deploy WasteAI backend",
        ignore_patterns=[
            ".env",
            "waste_ai.db",
            "feedback_images/*",
            "feedback_dataset/*",
            "__pycache__/*",
            "*.pyc",
            "start_backend.bat",
        ],
    )

    print(f"[WasteAI] Done: https://huggingface.co/spaces/{args.repo_id}")
    print(f"[WasteAI] Backend URL: https://{args.repo_id.split('/')[1]}.hf.space")


if __name__ == "__main__":
    main()
