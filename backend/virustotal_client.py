"""
virustotal_client.py
---------------------
Клиент за VirusTotal API v3 — проверява репутацията на URL спрямо
десетки антивирусни/security engines.

За да работи, е нужен VIRUSTOTAL_API_KEY (задава се като променлива
на средата или директно в api.py). Ако няма ключ или няма интернет,
се използва offline_fallback().
"""

import base64
import os

import requests

VT_BASE_URL = "https://www.virustotal.com/api/v3/urls"
REQUEST_TIMEOUT = 8

# Ключът се чете от променлива на средата — НЕ го хардкодвай в кода
API_KEY = os.environ.get("VIRUSTOTAL_API_KEY", "")


def check_url(url: str) -> dict:
    """
    Проверява URL във VirusTotal.

    Args:
        url: URL-ът за проверка

    Returns:
        речник с:
            malicious, suspicious, harmless, undetected: брой engines
            total_engines: общ брой engines, дали са гласували
            is_flagged: bool — дали е маркиран като заплаха
            source: "virustotal" или "offline_fallback"
    """
    if not API_KEY:
        return offline_fallback("Липсва VIRUSTOTAL_API_KEY — работи се в офлайн режим.")

    try:
        # VirusTotal изисква URL-ID = base64(url) без padding ('=')
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")

        response = requests.get(
            f"{VT_BASE_URL}/{url_id}",
            headers={"x-apikey": API_KEY},
            timeout=REQUEST_TIMEOUT,
        )

        if response.status_code == 404:
            # URL-ът не е бил анализиран досега от VirusTotal
            return {
                "malicious": 0,
                "suspicious": 0,
                "harmless": 0,
                "undetected": 0,
                "total_engines": 0,
                "is_flagged": False,
                "source": "virustotal",
                "note": "URL-ът не е намерен в базата на VirusTotal (все още неанализиран).",
            }

        response.raise_for_status()
        data = response.json()

        stats = (
            data.get("data", {})
            .get("attributes", {})
            .get("last_analysis_stats", {})
        )

        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)
        harmless = stats.get("harmless", 0)
        undetected = stats.get("undetected", 0)
        total = malicious + suspicious + harmless + undetected

        return {
            "malicious": malicious,
            "suspicious": suspicious,
            "harmless": harmless,
            "undetected": undetected,
            "total_engines": total,
            "is_flagged": malicious > 0 or suspicious > 2,
            "source": "virustotal",
        }

    except requests.exceptions.RequestException as exc:
        return offline_fallback(f"Грешка при връзка с VirusTotal: {str(exc)}")


def offline_fallback(reason: str = "Няма достъп до VirusTotal.") -> dict:
    """
    Връща неутрален резултат, когато VirusTotal е недостъпен
    (без интернет, без API ключ, или грешка в заявката).
    Крайното решение тогава се основава само на евристиките.
    """
    return {
        "malicious": 0,
        "suspicious": 0,
        "harmless": 0,
        "undetected": 0,
        "total_engines": 0,
        "is_flagged": False,
        "source": "offline_fallback",
        "note": reason,
    }
