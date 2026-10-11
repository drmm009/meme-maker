import os
import sys
import base64
import urllib.request
import numpy as np
import cv2
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import insightface
from insightface.app import FaceAnalysis

app = FastAPI(title="Offline InSwapper AI Face Swap Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global models
face_app = None
swapper = None

def get_models():
    global face_app, swapper
    if face_app is None:
        print("[InSwapper Server] Initializing FaceAnalysis (buffalo_l)...")
        face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
        face_app.prepare(ctx_id=0, det_size=(640, 640))
        print("[InSwapper Server] FaceAnalysis ready.")

    if swapper is None:
        swapper_path = os.path.expanduser('~/Downloads/inswapper_128.onnx')
        if not os.path.exists(swapper_path):
            swapper_path = os.path.expanduser('~/.insightface/models/inswapper_128.onnx')
        if not os.path.exists(swapper_path):
            raise RuntimeError(f"InSwapper model not found at {swapper_path}")
        print(f"[InSwapper Server] Loading InSwapper from {swapper_path}...")
        swapper = insightface.model_zoo.get_model(swapper_path, download=False, download_zip=False, providers=['CPUExecutionProvider'])
        print("[InSwapper Server] InSwapper ready.")
    return face_app, swapper

def decode_image(data_str: str) -> np.ndarray:
    if data_str.startswith('http://') or data_str.startswith('https://'):
        req = urllib.request.Request(data_str, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req) as response:
            arr = np.asarray(bytearray(response.read()), dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return img

    if ',' in data_str:
        data_str = data_str.split(',', 1)[1]
    
    img_bytes = base64.b64decode(data_str)
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
    image: str

class SwapRequest(BaseModel):
    source_image: str  # User photo (data URL or URL)
    target_image: str  # Meme image or template (data URL or URL)
    target_center: Optional[List[float]] = None  # [norm_x, norm_y] e.g. [0.5, 0.75]
    target_face_index: Optional[int] = None  # Specific face index (0, 1, 2...)
    swap_all: Optional[bool] = False  # Swap all detected faces in the meme
    blend_ratio: Optional[float] = 1.0  # 0.0 = original, 1.0 = full swap
    crop_only: Optional[bool] = False  # If True, returns only the swapped face square

@app.get("/api/face-swap/status")
def get_status():
    swapper_path = os.path.expanduser('~/Downloads/inswapper_128.onnx')
    model_exists = os.path.exists(swapper_path)
    return {
        "status": "online",
        "engine": "InSwapper-128 Neural AI",
        "model_available": model_exists,
        "offline": True
    }

@app.post("/api/face-swap/detect-faces")
def detect_faces(req: DetectRequest):
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
def face_swap(req: SwapRequest):
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
