# Quishing Detector — прототип за дипломна работа

Инструмент (React PWA + FastAPI backend), който сканира QR кодове,
анализира скритите зад тях URL-и (redirect chain + евристики +
VirusTotal) и предупреждава потребителя за фишинг заплахи.

## Структура на проекта

```
quishing-detector/
├── backend/
│   ├── api.py                 # FastAPI сървър, endpoint-и
│   ├── qr_handler.py          # Декодиране на QR от изображение (OpenCV)
│   ├── redirect_resolver.py   # Проследяване на HTTP redirect верига
│   ├── heuristics.py          # Изчисляване на risk score (0-100)
│   ├── virustotal_client.py   # Проверка във VirusTotal API v3
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx             # Навигация (Home / Scan / Result / Dashboard)
    │   ├── Scanner.jsx         # Камера + сканиране на QR (html5-qrcode)
    │   ├── Result.jsx          # Показва резултата от анализа
    │   ├── Dashboard.jsx       # Статистики (recharts) + история
    │   ├── api.js               # axios заявки към backend
    │   ├── storage.js           # localStorage история
    │   ├── App.css / index.css
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js           # Vite + PWA конфигурация
    └── package.json
```

## 1. Инсталация на backend

```bash
cd quishing-detector/backend
python3 -m venv venv
source venv/bin/activate          # На Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### (По избор) VirusTotal API ключ

Без ключ инструментът работи изцяло на база евристики (offline_fallback).
За да включиш реална VirusTotal проверка:

1. Регистрирай се безплатно: https://www.virustotal.com/gui/join-us
2. Вземи API ключа си от профила
3. Задай го като променлива на средата преди стартиране:

```bash
export VIRUSTOTAL_API_KEY="твоя_ключ_тук"     # На Windows (PowerShell): $env:VIRUSTOTAL_API_KEY="твоя_ключ"
```

### Стартиране на backend

```bash
uvicorn api:app --reload --port 8000
```

Провери, че работи: отвори http://localhost:8000/health — трябва да
видиш `{"status": "ok", ...}`.

## 2. Инсталация на frontend

Отвори нов терминал:

```bash
cd quishing-detector/frontend
npm install
npm run dev
```

Отвори връзката, която Vite показва (обикновено http://localhost:5173).

> **Важно за камерата:** браузърите разрешават достъп до камера само през
> HTTPS или `localhost`. На десктоп `localhost:5173` работи директно.
> За тест на телефон в същата WiFi мрежа, ползвай `npm run dev -- --host`
> и отвори `https://<IP>:5173` (може да се наложи self-signed сертификат
> или туннел като ngrok/localtunnel).

## 3. Как да тестваш

### Ръчно въвеждане на URL (най-лесно за демонстрация)

На Home екрана въведи URL в полето и натисни "Провери":

**Безопасни примери (би трябвало да излязат ЗЕЛЕНИ):**
- `https://www.google.com`
- `https://github.com`
- `https://www.wikipedia.org`

**Примери, които би трябвало да покачат risk score (ЧЕРВЕНИ или гранични):**
- `http://192.168.1.1/login` — IP адрес + HTTP + ключова дума "login"
- `http://example.com/secure-login-verify-account` — множество ключови думи + без HTTPS
- `https://accounts.gooogle.com.verify-secure-login.xyz/reset-password` — дълбоки поддомейни + typosquatting + ключови думи
- `http://bit.ly/somefakelink` — известен съкращавач (ще опита да го последва; ако линкът не съществува, ще хване грешка при resolve, което също е нормално поведение)

### Сканиране с камера

1. Генерирай QR код от произволен URL (напр. https://www.qr-code-generator.com/)
2. Отвори приложението на телефона (виж бележката за HTTPS по-горе)
3. Натисни "📷 Сканирай QR код" и насочи камерата към кода
4. Приложението автоматично декодира и анализира

### Качване на снимка с QR код (алтернатива на камерата)

На Scan екрана използвай "📁 Избери снимка" — качи скрийншот или снимка
с QR код, дори през десктоп браузър без камера.

### Dashboard

След няколко сканирания отвори "📊 Виж Dashboard" — ще видиш pie chart
(malicious vs legitimate), bar chart с най-честите евристични признаци
и таблица с последните 20 сканирания. "Изчисти история" нулира всичко
(само в localStorage на текущия браузър).

## Как работи risk score (heuristics.py)

| Признак | Максимални точки |
|---|---|
| Дължина на redirect веригата | 24 |
| URL съкращавач | 10 |
| IP адрес вместо домейн | 20 |
| Липса на HTTPS | 8 |
| Typosquatting (Levenshtein ≤ 2 до популярен домейн) | 25 |
| Подозрителни ключови думи (login, verify, secure...) | 15 |
| Прекомерна дълбочина на поддомейни (≥4) | 12 |

Праг за класификация: `score >= 40` → "malicious". Ако VirusTotal
маркира URL-а, се добавят +30 точки към финалния score.

## Известни ограничения (нормални за учебен прототип)

- Няма база данни — историята е само в localStorage на браузъра.
- Няма автентикация/потребители (по твое изискване).
- VirusTotal free tier има ограничение от заявки в минута — при много
  тестове подред може да получиш rate-limit грешка (тогава автоматично
  се използва offline_fallback).
- html5-qrcode изисква камера с разрешение от браузъра; на desktop без
  камера използвай качване на снимка.
