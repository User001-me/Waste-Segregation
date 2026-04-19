# WasteAI Frontend

React PWA for waste detection and segregation.

## Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your backend URL
npm start
```

## Build for production

```bash
npm run build
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
# Set REACT_APP_API_URL to your backend URL
```

## Deploy to Cloudflare Pages

From the project root on Windows, you can run:

```bat
start_cloudflare_build.bat
```

Or from inside `waste_detection_app/frontend`:

```bash
npm run build:cloudflare
```

Cloudflare Pages settings:

- Root directory: `waste_detection_app/frontend`
- Build command: `npm run build`
- Build output directory: `build`
- Environment variable: `REACT_APP_API_URL=https://your-backend-domain`

For a full Cloudflare setup note, see `CLOUDFLARE_PAGES.md`.

## Features

- Image upload with drag and drop
- Live webcam detection
- Uploaded-image annotation for missed objects and dataset correction
- Per-detection confidence scores
- Disposal instructions per class
- Feedback system for wrong predictions and new class suggestions
- Admin panel with review and retraining workflow

## Structure

```text
src/
|-- api/index.js
|-- components/
|   |-- Navbar.jsx
|   |-- ImageUpload.jsx
|   |-- WebcamDetector.jsx
|   |-- DrawCanvas.jsx
|   `-- DetectionResult.jsx
|-- pages/
|   |-- Home.jsx
|   `-- Admin.jsx
`-- index.css
```
