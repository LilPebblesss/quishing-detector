import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, TextInput, ScrollView, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { analyzeUrl, analyzeQrImage } from '../lib/api';
import { styles } from '../lib/styles';

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scannedUrl, setScannedUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [urlInput, setUrlInput] = useState('');

  // Сканиран QR код
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (loading || showModal) return;
    setScanning(false);
    setScannedUrl(data);
    runAnalysis(data);
  };

  // Анализ
  const runAnalysis = async (url: string) => {
    setShowModal(true);
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeUrl(url);
      setResult(res);
    } catch (err: any) {
      setResult({ error: 'Грешка: ' + (err.message || 'неуспешна заявка') });
    }
    setLoading(false);
  };

  // Ръчно въвеждане
  const handleManual = () => {
    if (!urlInput.trim()) return;
    setScannedUrl(urlInput.trim());
    runAnalysis(urlInput.trim());
  };

  // Избор от галерията
  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Нужно е разрешение за галерията');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (picked.canceled) return;

    setShowModal(true);
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeQrImage(picked.assets[0].uri);
      if (res.error) {
        setResult({ error: res.error });
      } else {
        setScannedUrl(res.original_url || res.url || '');
        setResult(res);
      }
    } catch (err: any) {
      setResult({ error: 'Грешка: ' + (err.message || 'неуспешно качване') });
    }
    setLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setScannedUrl('');
    setResult(null);
    setUrlInput('');
  };

  // --- Камера ---
  if (scanning) {
    if (!permission?.granted) {
      return (
        <View style={styles.center}>
          <Text style={styles.permText}>Нужно е разрешение за камерата</Text>
          <TouchableOpacity style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>Разреши</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanHint}>Насочи към QR код</Text>
        </View>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setScanning(false)}>
          <Text style={styles.cancelText}>✕ Затвори</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Начален екран ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Провери QR кода, преди да го отвориш</Text>

      <TouchableOpacity
        style={styles.scanBtn}
        onPress={() => {
          if (!permission?.granted) requestPermission();
          setScanning(true);
        }}
      >
        <Text style={styles.scanBtnText}>📷 Сканирай QR код</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickImage}>
        <Text style={styles.secondaryBtnText}>📁 Избери снимка</Text>
      </TouchableOpacity>

      <Text style={styles.divider}>— или въведи URL ръчно —</Text>

      <TextInput
        style={styles.input}
        placeholder="https://example.com"
        value={urlInput}
        onChangeText={setUrlInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.btn} onPress={handleManual}>
        <Text style={styles.btnText}>Анализирай</Text>
      </TouchableOpacity>

      {/* Резултат */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Сканиран URL:</Text>
            <Text style={styles.modalUrl} numberOfLines={3}>
              {result?.original_url || scannedUrl || '—'}
            </Text>

            {loading && (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 8, color: '#64748b' }}>Анализиране...</Text>
              </View>
            )}

            {!loading && result?.error && (
              <Text style={styles.errorText}>{result.error}</Text>
            )}

            {!loading && result && !result.error && result.verdict && (
              <>
                <View style={[
                  styles.verdictBox,
                  { backgroundColor: result.verdict === 'malicious' ? '#fee2e2' : '#d1fae5' },
                ]}>
                  <Text style={[
                    styles.verdictText,
                    { color: result.verdict === 'malicious' ? '#b91c1c' : '#047857' },
                  ]}>
                    {result.verdict === 'malicious' ? '🚨 ОПАСНО' : '✅ БЕЗОПАСНО'}
                  </Text>
                  <Text style={styles.verdictScore}>
                    Risk Score: {result.heuristics?.score ?? 0}/100
                  </Text>
                </View>

                {result.heuristics?.triggered_features?.length > 0 && (
                  <View style={styles.features}>
                    <Text style={styles.featuresTitle}>Задействани признаци:</Text>
                    {result.heuristics.triggered_features.map((f: string, i: number) => (
                      <Text key={i} style={styles.featureItem}>• {f}</Text>
                    ))}
                  </View>
                )}

                {result.redirect?.hop_count > 0 && (
                  <View style={styles.features}>
                    <Text style={styles.featuresTitle}>
                      Пренасочвания: {result.redirect.hop_count}
                    </Text>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
              <Text style={styles.closeBtnText}>Затвори</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}