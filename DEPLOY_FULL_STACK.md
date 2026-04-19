# WasteAI Full Deployment

This project is now set up for a practical split deployment:

- Frontend: Cloudflare Pages
- Backend: Render web service using the existing Docker backend
- Local development: root `start.bat`

## What I changed

- `start.bat` now starts the backend and frontend locally.
- `start_cloudflare_build.bat` keeps the Cloudflare Pages build flow.
- `render.yaml` prepares the Render backend service with persistent storage.

## Localhost

From the repo root:

```bat
start.bat
```

That opens:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Frontend on Cloudflare Pages

Use:

- Root directory: `waste_detection_app/frontend`
- Build command: `npm run build`
- Output directory: `build`
- Environment variable: `REACT_APP_API_URL=https://your-backend-domain`

You can generate the build locally with:

```bat
start_cloudflare_build.bat
```

## Backend on Render

The backend keeps SQLite, the YOLO model weights, feedback images, and curated dataset files on disk, so it needs a normal Python container host with persistent storage.

### Render setup

1. Push this repo to GitHub.
2. In Render, create a new Blueprint deployment from the repo or create a new Web Service manually.
3. If using the included `render.yaml`, Render will detect the `wasteai-backend` service.
4. For the backend, confirm:
   - Root directory: `waste_detection_app/backend`
   - Runtime: Docker
   - Health check path: `/health`
5. The included Render config already sets persistent app data paths for:
   - SQLite database
   - feedback images
   - feedback dataset folders
6. Add backend environment variables:
   - `MODEL_PATH=best.pt`
   - `ADMIN_PASSWORD=your_secure_password`
7. Make sure the backend has a persistent disk mounted.
8. After the backend deploys, copy its public URL.
9. Put that URL into the frontend environment variable:
   - `REACT_APP_API_URL=https://your-backend-url`
10. Redeploy the frontend on Cloudflare Pages.

## Important limitation

I prepared the repo so it is deployment-ready, but I cannot perform the final remote deployment from here without access to your Cloudflare and Render accounts or API tokens.
