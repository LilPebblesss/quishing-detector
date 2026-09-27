"""
redirect_resolver.py
---------------------
Проследява веригата от HTTP пренасочвания (redirect chain) за даден URL,
за да разкрие крайната дестинация преди потребителят да я посети.
"""

import requests

# Timeout за всяка HTTP заявка (в секунди)
REQUEST_TIMEOUT = 6

# Максимален брой стъпки, за да избегнем безкрайни/твърде дълги вериги
MAX_HOPS = 15

# Списък с популярни URL съкращавачи (за евристиката по-късно също се ползва)
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
    Проследява всички пренасочвания за даден URL.

    Args:
        url: началният URL, извлечен от QR кода

    Returns:
        речник с:
            original_url: подаденият URL
            hops: списък от речници {url, status_code}
            final_url: крайният URL след всички пренасочвания
            hop_count: брой пренасочвания
            used_shortener: дали началният домейн е известен съкращавач
            error: съобщение за грешка (или None)
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
                # Открит е цикъл от пренасочвания — спираме
                result["error"] = "Открит е цикъл от пренасочвания."
                break
            visited.add(current_url)

            # allow_redirects=False, за да хващаме всяка стъпка поотделно
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
                # Location може да е относителен път — правим го абсолютен
                current_url = requests.compat.urljoin(current_url, location)
            else:
                # Няма повече пренасочвания — това е крайният URL
                break

        result["final_url"] = current_url
        result["hop_count"] = len(result["hops"]) - 1 if result["hops"] else 0
        if result["hop_count"] < 0:
            result["hop_count"] = 0

    except requests.exceptions.Timeout:
        result["error"] = "Времето за изчакване изтече при опит за връзка с URL-а."
        result["final_url"] = current_url
    except requests.exceptions.SSLError:
        result["error"] = "SSL грешка — сертификатът на сайта е невалиден."
        result["final_url"] = current_url
    except requests.exceptions.ConnectionError:
        result["error"] = "Неуспешна връзка с целевия сървър (възможно е да не съществува)."
        result["final_url"] = current_url
    except requests.exceptions.RequestException as exc:
        result["error"] = f"Грешка при заявката: {str(exc)}"
        result["final_url"] = current_url

    return result


def _is_shortener(url: str) -> bool:
    """Проверява дали домейнът на URL-а е известен съкращавач на връзки."""
    try:
        from urllib.parse import urlparse
        netloc = urlparse(url).netloc.lower()
        netloc = netloc.replace("www.", "")
        return netloc in KNOWN_SHORTENERS
    except Exception:
        return False
