// api.ts — requests to the Python backend
import axios from 'axios';

// IMPORTANT: your laptop's IP address
const API_URL = 'http://192.168.1.32:8000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

export async function analyzeUrl(url: string) {
  const response = await client.post('/analyze', { url, offline: false });
  return response.data;
}

export async function analyzeQrImage(imageUri: string) {
  const formData = new FormData();
  const filename = imageUri.split('/').pop() || 'qr.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as any);

 
  const response = await fetch(`${API_URL}/analyze-qr?offline=false`, {
    method: 'POST',
    body: formData,
    
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 100)}`);
  }

  return response.json();
}