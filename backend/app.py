"""Flask backend for the Deepfake Detector webapp.

Endpoints:
  GET  /api/health               – health check
  POST /api/extract-frames       – extract frames from an uploaded video
  POST /api/analyze-frame        – placeholder deepfake analysis for a single frame
  POST /api/analyze-camera-frame – placeholder deepfake analysis for a live camera frame
"""

import os
import tempfile
import base64
import io

from flask import Flask, jsonify, request
from flask_cors import CORS

from utils.frame_extractor import extract_frames, encode_image_to_data_url, save_temp_file

app = Flask(__name__)

# Allow requests from the React dev server (port 5173) and any localhost origin
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# Maximum upload size: 200 MB
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024

ALLOWED_VIDEO_EXTENSIONS = {"mp4", "avi", "mov", "mkv", "webm"}
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}


def _allowed(filename: str, allowed: set) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
def health():
    """Simple health-check endpoint."""
    return jsonify({"status": "ok", "message": "Deepfake Detect API is running."})


@app.post("/api/extract-frames")
def extract_frames_endpoint():
    """Extract up to *max_frames* evenly-spaced frames from an uploaded video.

    Form fields:
      video      – the video file (required)
      max_frames – integer, default 10 (optional)
    """
    if "video" not in request.files:
        return jsonify({"error": "No video file provided."}), 400

    video_file = request.files["video"]
    if video_file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    if not _allowed(video_file.filename, ALLOWED_VIDEO_EXTENSIONS):
        return jsonify({"error": "Unsupported video format."}), 400

    max_frames = request.form.get("max_frames", 10)
    try:
        max_frames = int(max_frames)
        max_frames = max(1, min(max_frames, 30))  # clamp to [1, 30]
    except ValueError:
        max_frames = 10

    suffix = "." + video_file.filename.rsplit(".", 1)[1].lower()
    tmp_path = save_temp_file(video_file, suffix=suffix)

    try:
        frames = extract_frames(tmp_path, max_frames=max_frames)
    except ValueError:
        return jsonify({"error": "Could not extract frames from the provided video."}), 422
    finally:
        os.unlink(tmp_path)

    return jsonify({"frames": frames, "count": len(frames)})


@app.post("/api/analyze-frame")
def analyze_frame():
    """Placeholder endpoint: analyse a single uploaded image frame.

    Accepts multipart/form-data with an ``image`` file field.
    Returns a mock detection result until the ML model is integrated.
    """
    if "image" not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    image_file = request.files["image"]
    if image_file.filename == "" or not _allowed(image_file.filename, ALLOWED_IMAGE_EXTENSIONS):
        return jsonify({"error": "Invalid or unsupported image file."}), 400

    image_bytes = image_file.read()
    mime = "image/jpeg"
    ext = image_file.filename.rsplit(".", 1)[1].lower() if "." in image_file.filename else "jpeg"
    mime_map = {"jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png", "webp": "image/webp"}
    mime = mime_map.get(ext, "image/jpeg")

    data_url = encode_image_to_data_url(image_bytes, mime)

    # TODO: replace with actual model inference
    result = _mock_prediction()
    return jsonify({"prediction": result, "data_url": data_url})


@app.post("/api/analyze-camera-frame")
def analyze_camera_frame():
    """Placeholder endpoint: analyse a base64-encoded camera snapshot.

    Accepts JSON body: { "image": "<base64-encoded JPEG>" }
    Returns a mock detection result until the ML model is integrated.
    """
    body = request.get_json(silent=True)
    if not body or "image" not in body:
        return jsonify({"error": "Missing 'image' field in JSON body."}), 400

    # TODO: replace with actual model inference
    result = _mock_prediction()
    return jsonify({"prediction": result})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_prediction() -> dict:
    """Return a placeholder prediction response."""
    return {
        "label": "Pending",
        "confidence": None,
        "message": "ML model not yet integrated. This is a placeholder response.",
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=5000, debug=debug)
