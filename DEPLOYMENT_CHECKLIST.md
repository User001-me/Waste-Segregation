# WasteAI Deployment Checklist

This project uses the simplest practical public setup:

- Backend: Hugging Face Docker Space
- Frontend: Cloudflare Pages
- Source code: GitHub

## 1. GitHub

The project is already pushed here:

`https://github.com/User001-me/Waste-Segregation`

## 2. Hugging Face Backend

The backend deployment needs:

- Hugging Face account
- Hugging Face write token from `https://huggingface.co/settings/tokens`
- `best.pt` present at `waste_detection_app/backend/best.pt`

Run:

```bat
deploy_hf_space.bat
```

If the normal `hf auth login` command crashes, the `.bat` file will let you paste your token directly.

Expected backend Space:

`https://huggingface.co/spaces/Gujjar0Sasuke/Waste-Segregation-backend`

Expected API URL:

`https://Waste-Segregation-backend.hf.space`

Check:

`https://Waste-Segregation-backend.hf.space/health`

## 3. Cloudflare Frontend

Cloudflare Pages settings:

- GitHub repo: `User001-me/Waste-Segregation`
- Root directory: `waste_detection_app/frontend`
- Build command: `npm run build`
- Output directory: `build`
- Environment variable:
  - `REACT_APP_API_URL=https://Waste-Segregation-backend.hf.space`

After adding or changing `REACT_APP_API_URL`, redeploy the Cloudflare Pages project.

## 4. Share With Professor

Share the Cloudflare Pages URL, not the Hugging Face backend URL.

The frontend URL will look like:

`https://your-cloudflare-project.pages.dev`

## 5. Admin Login

The deploy script sets:

`ADMIN_PASSWORD=iitbhu2026`

Change it later in Hugging Face Space settings if you want a different password.
