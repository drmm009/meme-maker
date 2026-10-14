import os
import sys
import base64
import time
import socket
import ipaddress
import urllib.request
import urllib.parse
import numpy as np
import cv2
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import insightface
from insightface.app import FaceAnalysis

app = FastAPI(title="Offline InSwapper AI Face Swap Service")

# Pinned dev origins via env; never "*" with credentials.
# e.g. FACE_SWAP_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
_cors_env = os.environ.get("FACE_SWAP_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_allow_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Simple in-memory rate limit: 60 requests / 60s per client IP (POST endpoints only)
_RATE_LIMIT = 60
_RATE_WINDOW_S = 60.0
_rate_hits = {}


def check_rate_limit(request: Request):
    try:
        ip = request.client.host if request.client else "unknown"
    except Exception:
        ip = "unknown"
    now = time.monotonic()
    # Evict expired entries if table exceeds 1000 items to avoid memory exhaustion
    if len(_rate_hits) > 1000:
        expired = [k for k, v in _rate_hits.items() if now - v[1] > _RATE_WINDOW_S]
        for k in expired:
            _rate_hits.pop(k, None)
    hits = _rate_hits.get(ip)
    if hits is None or now - hits[1] > _RATE_WINDOW_S:
        _rate_hits[ip] = [1, now]
        return
    hits[0] += 1
    if hits[0] > _RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again shortly.")

# Global models
face_app = None
swapper = None

MAX_IMAGE_BYTES = 12 * 1024 * 1024  # 12MB cap per fetched/decoded image
FETCH_TIMEOUT_S = 10


def resolve_swapper_path():
    env_path = os.environ.get("INSWAPPER_MODEL_PATH")
    candidates = []
    if env_path:
        candidates.append(os.path.expanduser(env_path))
    candidates.append(os.path.expanduser('~/Downloads/inswapper_128.onnx'))
    candidates.append(os.path.expanduser('~/.insightface/models/inswapper_128.onnx'))
    for p in candidates:
        if p and os.path.exists(p):
            return p
    return candidates[0] if candidates else ''


def get_models():
    global face_app, swapper
    if face_app is None:
        print("[InSwapper Server] Initializing FaceAnalysis (buffalo_l)...", flush=True)
        face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        face_app.prepare(ctx_id=0, det_size=(640, 640))
        print("[InSwapper Server] FaceAnalysis ready.", flush=True)

    if swapper is None:
        swapper_path = resolve_swapper_path()
        if not os.path.exists(swapper_path):
            raise RuntimeError(
                "InSwapper model not found at %s. Set INSWAPPER_MODEL_PATH to the .onnx file." % swapper_path
            )
        print(f"[InSwapper Server] Loading InSwapper from {swapper_path}...", flush=True)
        swapper = insightface.model_zoo.get_model(swapper_path, download=False, download_zip=False, providers=['CPUExecutionProvider'])
        print("[InSwapper Server] InSwapper ready.", flush=True)
    return face_app, swapper


@app.on_event("startup")
def _preload_models():
    # Best-effort warm-up so the first request doesn't hang; keeps /status alive if model is missing.
    try:
        get_models()
    except Exception as e:
        print(f"[InSwapper Server] Startup preload skipped: {e}", flush=True)


def _read_limited(response):
    total = 0
    chunks = []
    while True:
        chunk = response.read(256 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_IMAGE_BYTES:
            raise ValueError("Remote image exceeds 12MB limit")
        chunks.append(chunk)
    return b"".join(chunks)


def decode_image(data_str: str) -> np.ndarray:
    if not isinstance(data_str, str) or not data_str:
        raise ValueError("Empty image payload")
    if data_str.startswith('http://') or data_str.startswith('https://'):
        parsed = urllib.parse.urlparse(data_str)
        if not parsed.hostname:
            raise ValueError("Invalid image URL")
        # Block local/internal hosts to avoid SSRF (metadata endpoints, localhost, private RFC1918 subnets)
        host = parsed.hostname.lower()
        if host in ("localhost", "0.0.0.0") or host.endswith(".local"):
            raise ValueError("Local image URLs are not allowed")
        try:
            ip_info = socket.getaddrinfo(host, None)
            for addr in ip_info:
                ip_str = addr[4][0]
                ip_obj = ipaddress.ip_address(ip_str)
                if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local or ip_obj.is_reserved:
                    raise ValueError("Access to private/internal network addresses is forbidden")
        except (socket.gaierror, ValueError) as err:
            raise ValueError(f"Invalid or forbidden remote host: {str(err)}")
        req = urllib.request.Request(data_str, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=FETCH_TIMEOUT_S) as response:
            raw = _read_limited(response)
            arr = np.asarray(bytearray(raw), dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img

    if ',' in data_str:
        data_str = data_str.split(',', 1)[1]
    if len(data_str) > (MAX_IMAGE_BYTES * 4 // 3) + 1024:
        raise ValueError("Image payload exceeds 12MB limit")

    img_bytes = base64.b64decode(data_str, validate=True)
    if len(img_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("Image payload exceeds 12MB limit")
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img

def encode_image(img: np.ndarray, format='jpeg') -> str:
    success, buffer = cv2.imencode(f'.{format}', img)
    if not success:
        raise ValueError("Failed to encode image to buffer")
    b64 = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/{format};base64,{b64}"

class DetectRequest(BaseModel):
    image: str = Field(max_length=17_000_000)


class SwapRequest(BaseModel):
    source_image: str = Field(max_length=17_000_000)  # User photo (data URL or URL)
    target_image: str = Field(max_length=17_000_000)  # Meme image or template (data URL or URL)
    target_center: Optional[List[float]] = None  # [norm_x, norm_y] e.g. [0.5, 0.75]
    target_face_index: Optional[int] = Field(default=None, ge=0)  # Specific face index (0, 1, 2...)
    swap_all: Optional[bool] = False  # Swap all detected faces in the meme
    blend_ratio: Optional[float] = Field(default=1.0, ge=0.0, le=1.0)  # 0.0 = original, 1.0 = full swap
    crop_only: Optional[bool] = False  # If True, returns only the swapped face square

@app.get("/api/face-swap/status")
@app.get("/api/face-swap/health")
def get_status():
    swapper_path = resolve_swapper_path()
    model_exists = os.path.exists(swapper_path)
    return {
        "status": "online",
        "engine": "InSwapper-128 Neural AI",
        "model_available": model_exists,
        "offline": True
    }

@app.post("/api/face-swap/detect-faces")
def detect_faces(req: DetectRequest, request: Request):
    check_rate_limit(request)
    try:
        app_model, _ = get_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model initialization failed: {str(e)}")

    try:
        img = decode_image(req.image)
        if img is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decoding error: {str(e)}")

    target_h, target_w = img.shape[:2]
    faces = app_model.get(img)
    # Sort top to bottom, then left to right
    sorted_faces = sorted(
        faces,
        key=lambda f: (f.bbox[1], f.bbox[0])
    )

    detected_faces_info = []
    for idx, face in enumerate(sorted_faces):
        fb = face.bbox.astype(int)
        pad = int(max(fb[2] - fb[0], fb[3] - fb[1]) * 0.25)
        y1 = max(0, fb[1] - pad)
        y2 = min(target_h, fb[3] + pad)
        x1 = max(0, fb[0] - pad)
        x2 = min(target_w, fb[2] + pad)
        face_crop = img[y1:y2, x1:x2]
        crop_thumb = encode_image(face_crop, format='jpeg')
        cx = float((fb[0] + fb[2]) / 2.0 / target_w)
        cy = float((fb[1] + fb[3]) / 2.0 / target_h)
        detected_faces_info.append({
            "index": idx,
            "center": [cx, cy],
            "bbox": fb.tolist(),
            "thumb": crop_thumb
        })

    return {
        "success": True,
        "count": len(detected_faces_info),
        "faces": detected_faces_info
    }

@app.post("/api/face-swap")
def face_swap(req: SwapRequest, request: Request):
    check_rate_limit(request)
    try:
        app_model, swap_model = get_models()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model initialization failed: {str(e)}")

    try:
        source_img = decode_image(req.source_image)
        if source_img is None:
            raise HTTPException(status_code=400, detail="Could not decode source image")

        target_img = decode_image(req.target_image)
        if target_img is None:
            raise HTTPException(status_code=400, detail="Could not decode target image")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Image decoding error: {str(e)}")

    # Detect source face
    source_faces = app_model.get(source_img)
    if len(source_faces) == 0:
        return {
            "success": False,
            "error": "No face detected in your photo. Please upload a clear front-facing portrait."
        }
    # Choose largest source face
    source_face = sorted(
        source_faces,
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
        reverse=True
    )[0]

    # Detect target faces in meme
    target_faces = app_model.get(target_img)
    if len(target_faces) == 0:
        return {
            "success": False,
            "error": "No face detected in the meme image. Ensure the meme template has a visible person."
        }

    # Sort target faces top-to-bottom, left-to-right for consistent ordering
    target_h, target_w = target_img.shape[:2]
    sorted_target_faces = sorted(
        target_faces,
        key=lambda f: (f.bbox[1], f.bbox[0])
    )

    detected_faces_info = []
    for idx, face in enumerate(sorted_target_faces):
        fb = face.bbox.astype(int)
        pad = int(max(fb[2] - fb[0], fb[3] - fb[1]) * 0.25)
        y1 = max(0, fb[1] - pad)
        y2 = min(target_h, fb[3] + pad)
        x1 = max(0, fb[0] - pad)
        x2 = min(target_w, fb[2] + pad)
        face_crop = target_img[y1:y2, x1:x2]
        crop_thumb = encode_image(face_crop, format='jpeg')
        cx = float((fb[0] + fb[2]) / 2.0 / target_w)
        cy = float((fb[1] + fb[3]) / 2.0 / target_h)
        detected_faces_info.append({
            "index": idx,
            "center": [cx, cy],
            "bbox": fb.tolist(),
            "thumb": crop_thumb
        })

    # Determine which target face(s) to swap
    swapped_target = target_img.copy()
    primary_target_face = sorted_target_faces[0]

    if req.swap_all:
        for face in sorted_target_faces:
            swapped_target = swap_model.get(swapped_target, face, source_face, paste_back=True)
    elif req.target_face_index is not None and 0 <= req.target_face_index < len(sorted_target_faces):
        primary_target_face = sorted_target_faces[req.target_face_index]
        swapped_target = swap_model.get(swapped_target, primary_target_face, source_face, paste_back=True)
    elif req.target_center and len(req.target_center) >= 2:
        pin_x, pin_y = req.target_center[0], req.target_center[1]
        best_dist = float('inf')
        for face in sorted_target_faces:
            cx = (face.bbox[0] + face.bbox[2]) / 2.0 / target_w
            cy = (face.bbox[1] + face.bbox[3]) / 2.0 / target_h
            dist = (cx - pin_x) ** 2 + (cy - pin_y) ** 2
            if dist < best_dist:
                best_dist = dist
                primary_target_face = face
        swapped_target = swap_model.get(swapped_target, primary_target_face, source_face, paste_back=True)
    else:
        primary_target_face = sorted_target_faces[0]
        swapped_target = swap_model.get(swapped_target, primary_target_face, source_face, paste_back=True)

    # Blend ratio if < 1.0
    if req.blend_ratio is not None and 0.0 <= req.blend_ratio < 0.99:
        alpha = float(req.blend_ratio)
        swapped_target = cv2.addWeighted(swapped_target, alpha, target_img, 1.0 - alpha, 0)

    result_data_url = encode_image(swapped_target, format='jpeg')

    # Crop preview of primary swapped face
    bbox = primary_target_face.bbox.astype(int)
    pad = int(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * 0.35)
    y1 = max(0, bbox[1] - pad)
    y2 = min(target_h, bbox[3] + pad)
    x1 = max(0, bbox[0] - pad)
    x2 = min(target_w, bbox[2] + pad)
    cropped = swapped_target[y1:y2, x1:x2]
    crop_data_url = encode_image(cropped, format='jpeg')

    # Also generate original crop of primary face for Before/After compare
    orig_cropped = target_img[y1:y2, x1:x2]
    orig_crop_data_url = encode_image(orig_cropped, format='jpeg')

    return {
        "success": True,
        "image": result_data_url,
        "crop_image": crop_data_url,
        "original_crop_image": orig_crop_data_url,
        "detected_faces_count": len(sorted_target_faces),
        "detected_faces": detected_faces_info,
        "swapped_face_index": req.target_face_index if req.target_face_index is not None else 0,
        "target_face_bbox": primary_target_face.bbox.tolist()
    }

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5174))
    print(f"[InSwapper Server] Starting server on http://127.0.0.1:{port}...")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
