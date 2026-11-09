"""Video link helper for the video editor's Paste link (src/utils/videoLink.ts).

A social media post (TikTok, Instagram, YouTube, X...) is a web page, and the browser can't get its
video out, so this local helper does it with yt-dlp and sends the video back as an MP4 (720p at
most, 10 minutes at most, 200 MB at most). Public posts only: it never signs in.

    pip install -U "yt-dlp[default]" fastapi uvicorn
    python video_link_server.py          # http://127.0.0.1:5175

The dev server proxies /api/video-link here, so a phone on the same Wi-Fi can use it too. FFmpeg on
the PATH lets it join separate picture and sound streams (YouTube's better qualities need it), and
YouTube needs a JavaScript runtime (Node or Deno on the PATH). Sites change often: when links stop
loading, update yt-dlp with the pip line above.
"""
import ipaddress
import os
import shutil
import socket
import tempfile
import urllib.parse

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from starlette.background import BackgroundTask

MAX_BYTES = 200 * 1024 * 1024
MAX_SECONDS = 10 * 60
MAX_HEIGHT = 720

app = FastAPI(title="Meme Creator video link helper")

# Pinned dev origins via env; never "*".
_cors_env = os.environ.get("VIDEO_LINK_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_env.split(",") if o.strip()],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    expose_headers=["X-Video-Title"],
)


class LinkIn(BaseModel):
    url: str = Field(min_length=8, max_length=2048)


def fail(status: int, code: str, message: str):
    # The app reads detail.code (videoLink.ts LINK_MESSAGES) and shows the message.
    raise HTTPException(status_code=status, detail={"code": code, "message": message})


def check_url(url: str):
    """Only public http(s) addresses: the helper isn't a way into this computer's network."""
    parts = urllib.parse.urlparse(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        fail(422, "unsupported", "That isn't a web link.")
    try:
        infos = socket.getaddrinfo(parts.hostname, None)
    except socket.gaierror:
        fail(422, "unsupported", "That site couldn't be found.")
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            fail(422, "unsupported", "That link points inside your own network.")


def ytdlp():
    try:
        import yt_dlp  # noqa: PLC0415 (loaded when needed, so status works without it)
        return yt_dlp
    except ImportError:
        fail(503, "failed", "yt-dlp isn't installed on the helper's computer: pip install yt-dlp")


@app.get("/api/video-link/status")
def status():
    try:
        import yt_dlp  # noqa: PLC0415
        version = yt_dlp.version.__version__
    except ImportError:
        version = None
    return {"ok": True, "ytdlp": version, "ffmpeg": bool(shutil.which("ffmpeg"))}


def too_long(info, *, incomplete=False):
    if info.get("is_live"):
        return "LIVE"
    duration = info.get("duration")
    if duration and duration > MAX_SECONDS:
        return "TOO_LONG"
    return None


@app.post("/api/video-link")
def fetch_video(link: LinkIn):
    url = link.url.strip()
    check_url(url)
    yt_dlp = ytdlp()
    has_ffmpeg = bool(shutil.which("ffmpeg"))
    h = MAX_HEIGHT
    # H.264 in MP4 first: every phone plays it and the app's exports read it.
    fmt = (
        f"bv*[height<={h}][vcodec^=avc1]+ba[ext=m4a]/b[height<={h}][ext=mp4]/bv*[height<={h}]+ba/b[height<={h}]/b"
        if has_ffmpeg else f"b[height<={h}][ext=mp4]/b[ext=mp4]/b[height<={h}]/b"
    )
    work = tempfile.mkdtemp(prefix="video-link-")
    opts = {
        "format": fmt,
        "outtmpl": os.path.join(work, "video.%(ext)s"),
        "noplaylist": True,
        "playlist_items": "1",
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        "max_filesize": MAX_BYTES,
        "match_filter": too_long,
        "merge_output_format": "mp4",
        "socket_timeout": 15,
        # A site that doesn't answer fails in well under a minute, not after yt-dlp's 10 tries.
        "retries": 2,
        "extractor_retries": 1,
        "fragment_retries": 2,
    }
    # YouTube's player needs JavaScript run: Deno (yt-dlp's default) or else Node.
    runtimes = {name: {} for name in ("deno", "node") if shutil.which(name)}
    if runtimes:
        opts["js_runtimes"] = runtimes
    try:
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
        except yt_dlp.utils.DownloadError as e:
            text = str(e).lower()
            if any(w in text for w in ("private", "login", "log in", "sign in", "cookies", "age-restricted", "confirm your age")):
                fail(403, "private", "This post is private or needs a login, so it can't be loaded.")
            if "unsupported url" in text or "no video" in text or "there is no video" in text:
                fail(422, "unsupported", "There's no video at that link.")
            fail(502, "failed", "Couldn't load that video. " + str(e).replace("ERROR: ", "")[:160])
        if info and info.get("entries"):
            info = next((e for e in info["entries"] if e), None)
        info = info or {}
        if info.get("is_live"):
            fail(422, "unsupported", "Live streams can't be loaded.")
        if (info.get("duration") or 0) > MAX_SECONDS:
            fail(413, "too-long", f"That video is over {MAX_SECONDS // 60} minutes. Try a shorter one.")
        files = [os.path.join(work, f) for f in os.listdir(work) if not f.endswith((".part", ".ytdl"))]
        files = [f for f in files if os.path.isfile(f)]
        if not files:
            fail(413, "too-big", "That video is too big (over 200 MB).")
        path = max(files, key=os.path.getsize)
        if os.path.getsize(path) > MAX_BYTES:
            fail(413, "too-big", "That video is too big (over 200 MB).")
        ext = os.path.splitext(path)[1].lower()
        media = {".webm": "video/webm", ".mov": "video/quicktime"}.get(ext, "video/mp4")
        title = (info.get("title") or "").strip()[:80]
        return FileResponse(
            path,
            media_type=media,
            headers={"X-Video-Title": urllib.parse.quote(title)} if title else None,
            background=BackgroundTask(shutil.rmtree, work, True),
        )
    except BaseException:
        shutil.rmtree(work, True)
        raise


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5175))
    print(f"[Video link helper] http://127.0.0.1:{port}  (ffmpeg: {'yes' if shutil.which('ffmpeg') else 'no'})")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
