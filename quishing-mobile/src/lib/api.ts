// api.ts — requests to the Python backend
import axios from 'axios';

// Base URL of the FastAPI backend. Set EXPO_PUBLIC_API_URL in .env so you can
// change networks without editing code. It must be the computer's LAN address
// (not localhost) so the phone can reach it over WiFi.
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

export async function analyzeUrl(url: string) {
  const response = await client.post('/analyze', { url, offline: false });
  return response.data;
}

export async function analyzeQrImage(imageUri: string, offline = false) {
  const filename = imageUri.split('/').pop() || 'qr.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  const response = await client.post('/analyze-qr', formData, {
    params: { offline },
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
}