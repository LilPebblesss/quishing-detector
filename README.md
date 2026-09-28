# Quishing Detector

A mobile application that detects Quishing (QR code phishing) attacks before the user opens the link.

## Overview

Quishing is a phishing technique that uses QR codes to redirect victims to malicious websites. Attackers place QR codes in emails, on physical stickers, or inside PDFs.
Modern smartphones often display the destination URL before opening it, but they do not analyze whether that URL is safe. The user sees a link, but has no way to know if it leads to a phishing page or to a legitimate website. The app analyzes the URL hidden in the QR code - following redirect chains, applying heuristic rules and checking VirusTotal - it shows the user a clear verdict (Safe or Malicious) before they decide to open it.

## Features

- Scan QR codes using the phone camera
- Upload QR code images from the gallery
- Manually enter URLs for analysis
- Follow the complete HTTP redirect chain
- Apply a heuristic model with 7 weighted features
- Optional VirusTotal API integration
- Clear verdict: Safe or Malicious, with a numeric risk score
- Display of all triggered heuristic features

## Architecture

The project consists of two parts:

- **Backend** - Python FastAPI server that performs URL analysis
- **Mobile app** - React Native (Expo) application for Android and iOS

The mobile app sends the decoded URL to the backend. The backend analyzes it and returns a verdict. The mobile app displays the result.

## Project structure

```
quishing-detector/
├── backend/
│   ├── api.py
│   ├── heuristics.py
│   ├── redirect_resolver.py
│   ├── virustotal_client.py
│   ├── qr_handler.py
│   └── requirements.txt
│
└── quishing-mobile/
    ├── src/
    │   ├── app/
    │   └── lib/
    └── package.json
```

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Optional — set a VirusTotal API key:

```bash
export VIRUSTOTAL_API_KEY="your_key_here"
```

Start the server:

```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### Mobile app

```bash
cd quishing-mobile
npm install
npx expo start
```

Scan the QR code shown in the terminal with the Expo Go app on your phone.

The phone and the computer must be on the same WiFi network. Set the computer's IP address in `src/lib/api.ts` instead of `localhost`.

## Detection logic

### Heuristic model

Each URL receives a risk score from 0 to 100, calculated from the following features:

| Feature | Weight |
|---|---|
| Redirect chain length | up to 24 |
| URL shortener usage | 10 |
| IP address as host | 20 |
| Missing HTTPS | 8 |
| Typosquatting (Levenshtein distance ≤ 2) | 25 |
| Suspicious keywords (login, verify, secure, etc.) | up to 15 |
| Excessive subdomain depth (≥ 4) | 12 |

A score of 25 or higher is classified as malicious.

### Redirect chain analysis

Quishing attacks often hide the final destination behind one or more redirects. The backend follows each HTTP 3xx hop and analyzes the complete chain, not just the first visible URL.

### VirusTotal

If a `VIRUSTOTAL_API_KEY` is provided, each URL is checked against 90+ antivirus engines. Without a key, the application runs in offline mode using only the heuristic model.

## Test cases

| URL | Expected result |
|---|---|
| `http://192.168.1.1/login` | DANGEROUS |
| `http://paypa1-secure.com/login?verify=1` | DANGEROUS |
| `https://accounts.google.com.verify-secure-login.xyz/reset` | DANGEROUS |
| `https://www.google.com` | SAFE |

## Limitations

- The evaluation dataset is small (12 examples).
- The free VirusTotal plan is limited to 4 requests per minute.
- The heuristic model can be bypassed by carefully crafted URLs.
- The typosquatting check covers a limited list of popular domains.


## Technologies

**Backend:** Python 3.12, FastAPI, Uvicorn, OpenCV, requests, python-Levenshtein, tldextract

**Mobile:** React Native, Expo, expo-camera, expo-image-picker, axios, TypeScript

## License

MIT
