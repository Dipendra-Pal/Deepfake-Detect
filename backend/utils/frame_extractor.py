"""Utility module for extracting frames from video files."""

import os
import cv2
import base64
import tempfile
import numpy as np


def extract_frames(video_path: str, max_frames: int = 10, resize: tuple = (320, 240)) -> list[dict]:
    """Extract evenly-spaced frames from a video file.

    Args:
        video_path: Absolute path to the video file.
        max_frames: Maximum number of frames to extract.
        resize: (width, height) to resize each frame before encoding.

    Returns:
        A list of dicts with keys ``index``, ``timestamp_ms``, and ``data_url``.
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25

    if total_frames <= 0:
        cap.release()
        raise ValueError("Video contains no frames or frame count is unavailable.")

    num_frames = min(max_frames, total_frames)
    indices = np.linspace(0, total_frames - 1, num=num_frames, dtype=int).tolist()

    frames = []
    for idx in indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        if not ret:
            continue

        if resize:
            frame = cv2.resize(frame, resize)

        # Encode frame as JPEG → base64 data URL
        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        b64 = base64.b64encode(buffer).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64}"

        timestamp_ms = int((idx / fps) * 1000)
        frames.append({"index": idx, "timestamp_ms": timestamp_ms, "data_url": data_url})

    cap.release()
    return frames


def encode_image_to_data_url(image_bytes: bytes, mime: str = "image/jpeg") -> str:
    """Encode raw image bytes to a base64 data URL."""
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:{mime};base64,{b64}"


def save_temp_file(file_storage, suffix: str = ".mp4") -> str:
    """Save a Werkzeug FileStorage object to a temporary file and return the path."""
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    file_storage.save(tmp.name)
    tmp.close()
    return tmp.name
