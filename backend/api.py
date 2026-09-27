"""
api.py
------
FastAPI сървър, който обединява всички модули и излага REST endpoint-и
за анализ на URL-и и QR кодове.

Стартиране: uvicorn api:app --reload --port 8000
"""

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import heuristics
import virustotal_client
from qr_handler import QRDecodeError, decode_qr_from_bytes
from redirect_resolver import resolve_redirects

app = FastAPI(
    title="Quishing Detector API",
    description="Backend за анализ на QR кодове и откриване на quishing атаки.",
    version="1.0.0",
)

# CORS — позволяваме заявки от локалния React dev сървър
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
    """Проверява дали сървърът работи."""
    return {"status": "ok", "service": "quishing-detector-backend"}


@app.post("/analyze")
def analyze_url(payload: AnalyzeRequest):
    """
    Анализира подаден URL:
    1. Проследява redirect веригата
    2. Изчислява евристичен risk score
    3. Проверява във VirusTotal (освен ако offline=True)
    4. Връща обединен резултат
    """
    url = payload.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL-ът не може да бъде празен.")

    if not (url.startswith("http://") or url.startswith("https://")):
        url = "http://" + url  # ако липсва схема, приемаме http по подразбиране

    return _run_full_analysis(url, offline=payload.offline)


@app.post("/analyze-qr")
async def analyze_qr(file: UploadFile = File(...), offline: bool = False):
    """
    Приема качено изображение с QR код, декодира го и пуска
    същия пълен анализ като /analyze.
    """
    image_bytes = await file.read()

    try:
        decoded_url = decode_qr_from_bytes(image_bytes)
    except QRDecodeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    if not (decoded_url.startswith("http://") or decoded_url.startswith("https://")):
        raise HTTPException(
            status_code=422,
            detail=f"QR кодът не съдържа валиден URL (съдържание: '{decoded_url}').",
        )

    return _run_full_analysis(decoded_url, offline=offline)


def _run_full_analysis(url: str, offline: bool) -> dict:
    """Обща логика за пълен анализ — използва се от двата endpoint-а."""
    redirect_data = resolve_redirects(url)
    final_url = redirect_data["final_url"]

    heuristic_result = heuristics.analyze(final_url, redirect_data["hop_count"])

    if offline:
        vt_result = virustotal_client.offline_fallback("Офлайн режим — VirusTotal пропуснат по избор.")
    else:
        vt_result = virustotal_client.check_url(final_url)

    # Ако VirusTotal маркира URL-а, добавяме бонус точки към score
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
