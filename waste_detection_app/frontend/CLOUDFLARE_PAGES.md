# Cloudflare Pages Deployment

This frontend can be hosted on Cloudflare Pages as a static React app.

## What works on Cloudflare

- The React frontend in this folder
- Client-side routing through `react-router-dom`
- Calls to an external API via `REACT_APP_API_URL`
- Static hosting of the upload, history, admin UI, and annotation workflow

## What does not work on Cloudflare as-is

The current Python backend is not directly deployable to Cloudflare Workers without a rewrite. It depends on:

- `ultralytics`
- `opencv-python`
- local `best.pt` weights
- SQLite file access via `aiosqlite`
- local filesystem writes for feedback images and dataset curation

## Recommended hosting split

- Host `frontend/` on Cloudflare Pages
- Host `backend/` on a normal Python host such as:
  - Hugging Face Spaces
  - Render
  - Railway
  - a VPS

Then set the frontend environment variable:

`REACT_APP_API_URL=https://your-backend-domain`

## Quick Windows flow

From the repo root, run:

```bat
start_cloudflare_build.bat
```

That script installs frontend dependencies if needed and creates the Cloudflare-ready production build inside `waste_detection_app/frontend/build`.

## Cloudflare Pages settings

Use these values in the Cloudflare dashboard:

- Framework preset: `Create React App` or `None`
- Build command: `npm run build`
- Build output directory: `build`
- Root directory: `waste_detection_app/frontend`

## SPA routing

This project includes `public/_redirects` with:

`/* /index.html 200`

That keeps React routes like `/admin` working on Cloudflare Pages.

## Deploy steps

1. Push this repo to GitHub.
2. In Cloudflare, go to `Workers & Pages` and create a new Pages project.
3. Import the repository.
4. Set root directory to `waste_detection_app/frontend`.
5. Set build command to `npm run build`.
6. Set build output directory to `build`.
7. Add environment variable `REACT_APP_API_URL` pointing to your backend.
8. Deploy.
