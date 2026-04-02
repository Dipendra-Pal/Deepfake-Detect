# Deepfake Detector

An AI-powered deepfake detection webapp that analyses images and video frames to identify AI-generated or manipulated media.

## Project Structure

```
Deepfake-Detect/
├── backend/          # Python Flask API
│   ├── app.py        # Main Flask server
│   ├── requirements.txt
│   └── utils/
│       └── frame_extractor.py  # Video frame extraction utility
└── frontend/         # React + Vite UI
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── Header.jsx          # App header
    │   │   ├── CameraCapture.jsx   # Live camera feed + snapshot
    │   │   ├── FrameExtractor.jsx  # Video upload + frame grid
    │   │   └── ResultDisplay.jsx   # Detection result panel
    │   └── ...
    └── package.json
```

## Getting Started

### Backend (Python Flask)

```bash
cd backend

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server (runs on http://localhost:5000)
python app.py
```

### Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server (runs on http://localhost:5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** The Flask backend must be running for frame extraction and analysis to work. The Vite dev server proxies all `/api/*` requests to `http://localhost:5000`.

## Features

### 📷 Live Camera
- Select from available camera devices
- Start/stop the live camera feed
- Capture a snapshot and send it to the backend for deepfake analysis

### 🎬 Video Frame Extractor
- Upload a video file (MP4, AVI, MOV, MKV, WebM)
- Choose how many frames to extract (1–30)
- Browse the extracted frames in a thumbnail grid
- Click any frame to send it to the backend for analysis

### 🛡 Detection Result
- Displays the label (`Real`, `Fake`, or `Pending`)
- Confidence bar (when available)
- Informational messages

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/extract-frames` | Extract frames from an uploaded video |
| POST | `/api/analyze-frame` | Analyse an uploaded image frame |
| POST | `/api/analyze-camera-frame` | Analyse a base64-encoded camera snapshot |

> **Note:** The ML model is not yet integrated. All analysis endpoints currently return a placeholder response. Integration of a trained deepfake detection model is the next step.
