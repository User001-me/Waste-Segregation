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
# Set REACT_APP_API_URL to your Hugging Face Space URL
```

## Features
- Image upload with drag & drop
- Live webcam detection (desktop + mobile)
- Mobile camera support (PWA)
- Per-detection confidence scores
- Disposal instructions per class
- Feedback system — correct wrong predictions
- Admin panel with retraining pipeline

## Structure
```
src/
├── api/index.js          ← All API calls
├── components/
│   ├── Navbar.jsx
│   ├── ImageUpload.jsx
│   ├── WebcamDetector.jsx
│   └── DetectionResult.jsx
├── pages/
│   ├── Home.jsx          ← Main detection page
│   └── Admin.jsx         ← Admin panel
└── index.css             ← Global styles + design tokens
```
