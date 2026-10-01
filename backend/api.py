

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import heuristics
import virustotal_client
from qr_handler import QRDecodeError, decode_qr_from_bytes
from redirect_resolver import resolve_redirects

app = FastAPI(
    title="Quishing Detector API",
    description="Backend for the Quishing Detector project — analyzes URLs and QR codes for phishing risks.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    url: str
    offline: bool = False


@app.get("/health")
def health_check():
    """Checks if the server is running."""
    return {"status": "ok", "service": "quishing-detector-backend"}


@app.post("/analyze")
def analyze_url(payload: AnalyzeRequest):
    """
    Analyses a submitted URL:
    1. Traces the redirect chain
    2. Calculates a heuristic risk score
    3. Checks against VirusTotal (unless offline=True)
    4. Returns the combined result
    """
    url = payload.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL cannot be empty.")

    if not (url.startswith("http://") or url.startswith("https://")):
        url = "http://" + url  # if no scheme is present, assume http by default

    return _run_full_analysis(url, offline=payload.offline)


@app.post("/analyze-qr")
async def analyze_qr(file: UploadFile = File(...), offline: bool = False):
    """
    Analyses an uploaded QR code image:
    1. Decodes the QR code
    2. Runs the full analysis like /analyze
    """
    image_bytes = await file.read()

    try:
        decoded_url = decode_qr_from_bytes(image_bytes)
    except QRDecodeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    if not (decoded_url.startswith("http://") or decoded_url.startswith("https://")):
        raise HTTPException(
            status_code=422,
            detail=f"QR code does not contain a valid URL (content: '{decoded_url}').",
        )

    return _run_full_analysis(decoded_url, offline=offline)


def _run_full_analysis(url: str, offline: bool) -> dict:
    """General logic for full analysis — used by both endpoints."""
    redirect_data = resolve_redirects(url)
    final_url = redirect_data["final_url"]

    heuristic_result = heuristics.analyze(final_url, redirect_data["hop_count"])

    if offline:
        vt_result = virustotal_client.offline_fallback("Offline mode — VirusTotal skipped by choice.")
    else:
        vt_result = virustotal_client.check_url(final_url)

    # If VirusTotal flags the URL, we add bonus points to the score
    score = heuristic_result["score"]
    if vt_result.get("is_flagged"):
        score = min(score + 30, 100)

    verdict = heuristics.classify(score)

    return {
        "original_url": redirect_data["original_url"],
        "final_url": final_url,
        "redirect": redirect_data,
        "heuristics": {
            **heuristic_result,
            "score": score,
        },
        "virustotal": vt_result,
        "verdict": verdict,
    }
