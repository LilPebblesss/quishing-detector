"""
heuristics.py
-------------
Изчислява risk score (0-100) за URL на база 7 евристични признака,
характерни за quishing/фишинг атаки.
"""

import re
from urllib.parse import urlparse

import Levenshtein
import tldextract

from redirect_resolver import KNOWN_SHORTENERS

# --- Тегла на отделните признаци (максимален принос към score) ---
WEIGHT_REDIRECT_CHAIN = 24
WEIGHT_SHORTENER = 10
WEIGHT_IP_ADDRESS = 20
WEIGHT_NO_HTTPS = 8
WEIGHT_TYPOSQUATTING = 25
WEIGHT_SUSPICIOUS_KEYWORDS = 15
WEIGHT_DEEP_SUBDOMAIN = 12

# Популярни домейни, спрямо които проверяваме typosquatting
POPULAR_DOMAINS = [
    "google.com", "facebook.com", "instagram.com", "apple.com",
    "microsoft.com", "amazon.com", "paypal.com", "netflix.com",
    "outlook.com", "gmail.com", "dropbox.com", "linkedin.com",
    "revolut.com", "postbank.bg", "unicreditbulbank.bg", "dskbank.bg",
    "ebag.bg", "epay.bg", "cibank.bg",
]

# Подозрителни ключови думи, характерни за фишинг URL-и
SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "update", "confirm",
    "wallet", "reset-password", "signin", "account", "banking",
]

# Regex за разпознаване на IPv4 адрес
IP_REGEX = re.compile(
    r"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$"
)


def analyze(url: str, hop_count: int) -> dict:
    """
    Изчислява risk score за URL на база евристики.

    Args:
        url: URL-ът за анализ (крайният URL след redirects)
        hop_count: брой пренасочвания, установени от redirect_resolver

    Returns:
        речник с score, triggered_features (списък от описания) и details
    """
    triggered_features = []
    details = {}
    score = 0

    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()

    # --- 1. Дължина на redirect веригата ---
    chain_points = min(hop_count * 6, WEIGHT_REDIRECT_CHAIN)
    if chain_points > 0:
        score += chain_points
        triggered_features.append(
            f"Дълга верига от пренасочвания ({hop_count} стъпки)"
        )
    details["redirect_chain_points"] = chain_points

    # --- 2. Използване на URL съкращавач ---
    netloc_clean = hostname.replace("www.", "")
    used_shortener = netloc_clean in KNOWN_SHORTENERS
    if used_shortener:
        score += WEIGHT_SHORTENER
        triggered_features.append("Използван е URL съкращавач")
    details["used_shortener"] = used_shortener

    # --- 3. IP адрес вместо домейн ---
    is_ip = bool(IP_REGEX.match(hostname))
    if is_ip:
        score += WEIGHT_IP_ADDRESS
        triggered_features.append("IP адрес вместо име на домейн")
    details["is_ip_address"] = is_ip

    # --- 4. Липса на HTTPS ---
    no_https = parsed.scheme != "https"
    if no_https:
        score += WEIGHT_NO_HTTPS
        triggered_features.append("Липсва HTTPS връзка")
    details["no_https"] = no_https

    # --- 5. Typosquatting (Levenshtein разстояние до популярни домейни) ---
    typo_match, typo_distance = _check_typosquatting(hostname)
    if typo_match:
        score += WEIGHT_TYPOSQUATTING
        triggered_features.append(
            f"Възможен typosquatting на '{typo_match}' (разстояние {typo_distance})"
        )
    details["typosquatting_target"] = typo_match
    details["typosquatting_distance"] = typo_distance

    # --- 6. Подозрителни ключови думи в URL ---
    found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in url.lower()]
    keyword_points = min(len(found_keywords) * 5, WEIGHT_SUSPICIOUS_KEYWORDS)
    if found_keywords:
        score += keyword_points
        triggered_features.append(
            f"Подозрителни ключови думи: {', '.join(found_keywords)}"
        )
    details["suspicious_keywords"] = found_keywords

    # --- 7. Прекомерна дълбочина на поддомейни ---
    extracted = tldextract.extract(hostname)
    subdomain_depth = len(extracted.subdomain.split(".")) if extracted.subdomain else 0
    deep_subdomain = subdomain_depth >= 4
    if deep_subdomain:
        score += WEIGHT_DEEP_SUBDOMAIN
        triggered_features.append(
            f"Прекомерна дълбочина на поддомейни ({subdomain_depth})"
        )
    details["subdomain_depth"] = subdomain_depth

    # Ограничаваме score до 100
    score = min(score, 100)

    return {
        "score": score,
        "triggered_features": triggered_features,
        "details": details,
    }


def _check_typosquatting(hostname: str):
 
    if not hostname:
        return None, None

    extracted = tldextract.extract(hostname)
    root_domain = f"{extracted.domain}.{extracted.suffix}" if extracted.suffix else hostname

    best_match = None
    best_distance = None

    for popular in POPULAR_DOMAINS:
        if root_domain == popular:
            # Точно съвпадение — легитимен домейн, не е typosquatting
            return None, None

        distance = Levenshtein.distance(root_domain, popular)
        # Смятаме за подозрително, ако разстоянието е малко (1-2 символа),
        # но домейнът не е идентичен — типично за typosquatting (напр. gooogle.com)
        if distance <= 2 and (best_distance is None or distance < best_distance):
            best_match = popular
            best_distance = distance

    return best_match, best_distance


def classify(score: int, threshold: int = 25) -> str:
    return "malicious" if score >= threshold else "legitimate"
