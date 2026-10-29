// api.ts — requests to the Python backend
import axios from 'axios';
import { Platform } from 'react-native';

// Base URL of the FastAPI backend. Set EXPO_PUBLIC_API_URL in .env so you can
// change networks without editing code. It must be the computer's LAN address
// (not localhost) so the phone can reach it over WiFi.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 60000, // Render free tier може да се буди до ~50s,
});

export async function analyzeUrl(url: string) {
  const response = await client.post('/analyze', { url, offline: true });
  return response.data;
}

export async function analyzeQrImage(imageUri: string, offline = true) {
  const filename = imageUri.split('/').pop() || 'qr.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  if (Platform.OS === 'web') {
    // In the browser the picked image is a blob/data URI, so it must be sent as a real Blob
    const blob = await (await fetch(imageUri)).blob();
    formData.append('file', blob, filename.includes('.') ? filename : 'qr.jpg');
  } else {
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    } as unknown as Blob);
  }

  const response = await client.post('/analyze-qr', formData, {
    params: { offline },
    // Let axios set the correct multipart boundary in React Native
  });
  return response.data;
}