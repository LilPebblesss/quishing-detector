"""
redirect_resolver.py
---------------------
Follows the HTTP redirect chain for a given URL
to reveal the final destination before the user visits it.
"""

import requests

# Timeout for each HTTP request (in seconds)
REQUEST_TIMEOUT = 6

# Maximum number of steps, to avoid endless/too long chains
MAX_HOPS = 15

# List of popular URL shorteners (also used later by the heuristic)
KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at", "rb.gy",
    "tiny.cc", "lnkd.in", "s.id", "v.gd",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36 QuishingDetector/1.0"
    )
}


def resolve_redirects(url: str) -> dict:
    """
    Follows all redirects for a given URL.

    Args:
        url: the initial URL, extracted from the QR code

    Returns:
        a dictionary with:
            original_url: the submitted URL
            hops: list of dictionaries {url, status_code}
            final_url: the final URL after all redirects
            hop_count: number of redirects
            used_shortener: whether the initial domain is a known shortener
            error: error message (or None)
    """
    result = {
        "original_url": url,
        "hops": [],
        "final_url": url,
        "hop_count": 0,
        "used_shortener": _is_shortener(url),
        "error": None,
    }

    current_url = url
    visited = set()

    try:
        for _ in range(MAX_HOPS):
            if current_url in visited:
                # A redirect loop has been detected — stop
                result["error"] = "A redirect loop was detected."
                break
            visited.add(current_url)

            # allow_redirects=False, so that we catch each step separately
            response = requests.get(
                current_url,
                headers=HEADERS,
                timeout=REQUEST_TIMEOUT,
                allow_redirects=False,
                stream=True,
            )
            response.close()

            result["hops"].append({
                "url": current_url,
                "status_code": response.status_code,
            })

            if response.is_redirect or response.status_code in (301, 302, 303, 307, 308):
                location = response.headers.get("Location")
                if not location:
                    break
                # Location may be a relative path — make it absolute
                current_url = requests.compat.urljoin(current_url, location)
            else:
                # No more redirects — this is the final URL
                break

        result["final_url"] = current_url
        result["hop_count"] = len(result["hops"]) - 1 if result["hops"] else 0
        if result["hop_count"] < 0:
            result["hop_count"] = 0

    except requests.exceptions.Timeout:
        result["error"] = "The request timed out while connecting to the URL."
        result["final_url"] = current_url
    except requests.exceptions.SSLError:
        result["error"] = "SSL error — the site's certificate is invalid."
        result["final_url"] = current_url
    except requests.exceptions.ConnectionError:
        result["error"] = "Failed to connect to the target server (it may not exist)."
        result["final_url"] = current_url
    except requests.exceptions.RequestException as exc:
        result["error"] = f"Request error: {str(exc)}"
        result["final_url"] = current_url

    return result


def _is_shortener(url: str) -> bool:
    """Checks whether the domain of the URL is a known link shortener."""
    try:
        from urllib.parse import urlparse
        netloc = urlparse(url).netloc.lower()
        netloc = netloc.replace("www.", "")
        return netloc in KNOWN_SHORTENERS
    except Exception:
        return False
