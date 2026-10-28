
import axios from 'axios';


const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_URL,
  timeout: 60000, 
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
  formData.append('file', {
    uri: imageUri,
    name: filename,
    type,
  } as unknown as Blob);

  const response = await client.post('/analyze-qr', formData, {
    params: { offline },

  });
  return response.data;
}