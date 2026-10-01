"""
virustotal_client.py
---------------------
VirusTotal API v3 client — checks the reputation of a URL against
dozens of antivirus/security engines.

It requires a VIRUSTOTAL_API_KEY (set as an environment variable
or directly in api.py). If there is no key or no internet connection,
offline_fallback() is used.
"""

import base64
import os

import requests

VT_BASE_URL = "https://www.virustotal.com/api/v3/urls"
REQUEST_TIMEOUT = 8

# The key is read from an environment variable — do NOT hardcode it in the source
API_KEY = os.environ.get("VIRUSTOTAL_API_KEY", "")


def check_url(url: str) -> dict:
    """
    Checks a URL on VirusTotal.

    Args:
        url: the URL to check

    Returns:
        a dictionary with:
            malicious, suspicious, harmless, undetected: engine counts
            total_engines: total number of engines, whether they have voted
            is_flagged: bool — whether it is flagged as a threat
            source: "virustotal" or "offline_fallback"
    """
    if not API_KEY:
        return offline_fallback("VIRUSTOTAL_API_KEY is missing — running in offline mode.")

    try:
        # VirusTotal requires URL-ID = base64(url) without padding ('=')
        url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")

        response = requests.get(
            f"{VT_BASE_URL}/{url_id}",
            headers={"x-apikey": API_KEY},
            timeout=REQUEST_TIMEOUT,
        )

        if response.status_code == 404:
            # The URL has not been analysed by VirusTotal before
            return {
                "malicious": 0,
                "suspicious": 0,
                "harmless": 0,
                "undetected": 0,
                "total_engines": 0,
                "is_flagged": False,
                "source": "virustotal",
                "note": "The URL was not found in the VirusTotal database (not analysed yet).",
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
        return offline_fallback(f"Error while connecting to VirusTotal: {str(exc)}")


def offline_fallback(reason: str = "No access to VirusTotal.") -> dict:
    """
    Returns a neutral result when VirusTotal is unavailable
    (no internet, no API key, or a request error).
    The final decision is then based only on the heuristics.
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
