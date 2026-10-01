"""
heuristics.py
-------------
Calculates a risk score (0-100) for a URL based on 7 heuristic indicators,
characteristic for quishing/phishing attacks.
"""

import re
from urllib.parse import urlparse

import Levenshtein
import tldextract

from redirect_resolver import KNOWN_SHORTENERS


WEIGHT_REDIRECT_CHAIN = 24
WEIGHT_SHORTENER = 10
WEIGHT_IP_ADDRESS = 20
WEIGHT_NO_HTTPS = 8
WEIGHT_TYPOSQUATTING = 25
WEIGHT_SUSPICIOUS_KEYWORDS = 15
WEIGHT_DEEP_SUBDOMAIN = 12

# Popular domains against which we check for typosquatting
POPULAR_DOMAINS = [
    "google.com", "facebook.com", "instagram.com", "apple.com",
    "microsoft.com", "amazon.com", "paypal.com", "netflix.com",
    "outlook.com", "gmail.com", "dropbox.com", "linkedin.com",
    "revolut.com", "postbank.bg", "unicreditbulbank.bg", "dskbank.bg",
    "ebag.bg", "epay.bg", "cibank.bg",
]

# Suspicious keywords characteristic of phishing URLs
SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "update", "confirm",
    "wallet", "reset-password", "signin", "account", "banking",
]

# Regex for detecting an IPv4 address
IP_REGEX = re.compile(
    r"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$"
)


def analyze(url: str, hop_count: int) -> dict:
    """
    Calculates a risk score for a URL based on heuristics.

    Args:
        url: The URL to analyze (the final URL after redirects)
        hop_count: The number of redirects, as determined by redirect_resolver

    Returns:
        A dictionary with the score, triggered_features (list of descriptions) and details
    """
    triggered_features = []
    details = {}
    score = 0

    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()

    
    chain_points = min(hop_count * 6, WEIGHT_REDIRECT_CHAIN)
    if chain_points > 0:
        score += chain_points
        triggered_features.append(
            f"Long redirect chain ({hop_count} steps)"
        )
    details["redirect_chain_points"] = chain_points

    # --- 2. Use of URL shortener ---
    netloc_clean = hostname.replace("www.", "")
    used_shortener = netloc_clean in KNOWN_SHORTENERS
    if used_shortener:
        score += WEIGHT_SHORTENER
        triggered_features.append("URL shortener used")
    details["used_shortener"] = used_shortener

    # --- 3. IP address instead of domain ---
    is_ip = bool(IP_REGEX.match(hostname))
    if is_ip:
        score += WEIGHT_IP_ADDRESS
        triggered_features.append("IP address instead of domain name")
    details["is_ip_address"] = is_ip

    # --- 4. Lack of HTTPS ---
    no_https = parsed.scheme != "https"
    if no_https:
        score += WEIGHT_NO_HTTPS
        triggered_features.append("Lack of HTTPS connection")
    details["no_https"] = no_https

    # --- 5. Typosquatting (Levenshtein distance to popular domains) ---
    typo_match, typo_distance = _check_typosquatting(hostname)
    if typo_match:
        score += WEIGHT_TYPOSQUATTING
        triggered_features.append(
            f"Possible typosquatting on '{typo_match}' (distance {typo_distance})"
        )
    details["typosquatting_target"] = typo_match
    details["typosquatting_distance"] = typo_distance

    # --- 6. Suspicious keywords in URL ---
    found_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in url.lower()]
    keyword_points = min(len(found_keywords) * 5, WEIGHT_SUSPICIOUS_KEYWORDS)
    if found_keywords:
        score += keyword_points
        triggered_features.append(
            f"Suspicious keywords: {', '.join(found_keywords)}"
        )
    details["suspicious_keywords"] = found_keywords

    # --- 7. Excessive subdomain depth ---
    extracted = tldextract.extract(hostname)
    subdomain_depth = len(extracted.subdomain.split(".")) if extracted.subdomain else 0
    deep_subdomain = subdomain_depth >= 4
    if deep_subdomain:
        score += WEIGHT_DEEP_SUBDOMAIN
        triggered_features.append(
            f"Excessive subdomain depth ({subdomain_depth})"
        )
    details["subdomain_depth"] = subdomain_depth

    # --- 8. Limit score to 100 ---
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
            # Exact match — legitimate domain, not typosquatting
            return None, None

        distance = Levenshtein.distance(root_domain, popular)
        # We consider it suspicious if the distance is small (1-2 characters),
        # but the domain is not identical — typical for typosquatting (e.g., gooogle.com)
        if distance <= 2 and (best_distance is None or distance < best_distance):
            best_match = popular
            best_distance = distance

    return best_match, best_distance


def classify(score: int, threshold: int = 25) -> str:
    return "malicious" if score >= threshold else "legitimate"
