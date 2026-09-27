"""
qr_handler.py
-------------
Модул за декодиране на QR кодове от изображение с помощта на OpenCV.
Приема суровите байтове на качено изображение и връща декодирания текст (URL).
"""

import cv2
import numpy as np


class QRDecodeError(Exception):
    """Изключение при неуспешно декодиране на QR код."""
    pass


def decode_qr_from_bytes(image_bytes: bytes) -> str:
    """
    Декодира QR код от байтове на изображение.

    Args:
        image_bytes: суровите байтове на изображението (напр. от качен файл)

    Returns:
        Декодираният текст от QR кода (обикновено URL)

    Raises:
        QRDecodeError: ако изображението е невалидно или не съдържа QR код
    """
    # Преобразуваме байтовете в numpy масив, който OpenCV може да прочете
    np_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        raise QRDecodeError("Невалиден файл с изображение — не може да бъде прочетен.")

    # Инициализираме детектора на QR кодове на OpenCV
    detector = cv2.QRCodeDetector()

    # Опитваме директно детектиране и декодиране
    data, points, _ = detector.detectAndDecode(image)

    if data:
        return data.strip()

    # Ако не се засече веднага, пробваме с предобработка (grayscale + threshold)
    # Това помага при снимки с лошо осветление или ъгъл
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    data, points, _ = detector.detectAndDecode(thresh)

    if data:
        return data.strip()

    raise QRDecodeError("Не беше открит QR код в изображението.")
