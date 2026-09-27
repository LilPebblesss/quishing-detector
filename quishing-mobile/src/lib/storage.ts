// storage.ts — запазва историята на сканиранията на телефона
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@quishing_history';

export async function saveScan(scan: { url: string; verdict: string; score: number }) {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.unshift({ ...scan, timestamp: Date.now() });
    await AsyncStorage.setItem(KEY, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.warn('Грешка при запазване:', e);
  }
}

export async function getHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearHistory() {
  await AsyncStorage.removeItem(KEY);
}