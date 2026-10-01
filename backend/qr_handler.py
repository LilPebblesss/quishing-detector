"""
qr_handler.py
-------------
Module for decoding QR codes from an image using OpenCV.
Accepts the raw bytes of an uploaded image and returns the decoded text (URL).
"""

import cv2
import numpy as np


class QRDecodeError(Exception):
    """Raised when QR code decoding fails."""
    pass


def decode_qr_from_bytes(image_bytes: bytes) -> str:
    """
    Decodes a QR code from image bytes.

    Args:
        image_bytes: the raw bytes of the image (e.g. from an uploaded file)

    Returns:
        The decoded text of the QR code (usually a URL)

    Raises:
        QRDecodeError: if the image is invalid or contains no QR code
    """
    # Convert the bytes into a numpy array that OpenCV can read
    np_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if image is None:
        raise QRDecodeError("Invalid image file — it cannot be read.")

    # Initialize OpenCV's QR code detector
    detector = cv2.QRCodeDetector()

    # First try direct detection and decoding
    data, points, _ = detector.detectAndDecode(image)

    if data:
        return data.strip()

    # If nothing is detected right away, try with preprocessing (grayscale + threshold)
    # This helps with photos taken in poor lighting or at an angle
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    data, points, _ = detector.detectAndDecode(thresh)

    if data:
        return data.strip()

    raise QRDecodeError("No QR code was detected in the image.")
