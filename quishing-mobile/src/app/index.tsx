import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, TextInput, ScrollView, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyzeUrl, analyzeQrImage } from '../lib/api';
import { styles, theme, pixelLabel } from '../lib/styles';
import { Arrow, QrLogo, ScanFrame } from '../components/scanner-art';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [scannedUrl, setScannedUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [urlInput, setUrlInput] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    let reduce = false;
    (async () => {
      try {
        const r = await (require('react-native').AccessibilityInfo?.isReduceMotionEnabled?.());
        reduce = !!r;
      } catch {}
      if (reduce) { setCursorVisible(true); return; }
      const id = setInterval(() => setCursorVisible(v => !v), 500);
      return () => clearInterval(id);
    })();
  }, []);

  // Scanned QR code
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (loading || showModal) return;
    setScanning(false);
    setScannedUrl(data);
    runAnalysis(data);
  };

  // Analysis
  const runAnalysis = async (url: string) => {
    setShowModal(true);
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeUrl(url);
      setResult(res);
     } catch (err: any) {
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      setResult({
        error: 'Error: ' + (isTimeout ? 'server took too long to respond. Make sure backend is running on ' + (process.env.EXPO_PUBLIC_API_URL || 'LAN') : err.message || 'request failed'),
      });
    }
    setLoading(false);
  };

  // Manual entry
  const handleManual = () => {
    if (!urlInput.trim()) return;
    setScannedUrl(urlInput.trim());
    runAnalysis(urlInput.trim());
  };

  // Picking from the gallery
  const handlePickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Gallery permission is required');
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
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout');
      setResult({
        error: 'Error: ' + (isTimeout ? 'server took too long to respond. Make sure backend is running on ' + (process.env.EXPO_PUBLIC_API_URL || 'LAN') : err.message || 'upload failed'),
      });
    }
    setLoading(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setScannedUrl('');
    setResult(null);
    setUrlInput('');
  };

  // --- Camera ---
  if (scanning) {
    if (!permission?.granted) {
      return (
        <View style={styles.center}>
          <Text style={styles.permText}>
            Camera permission is required{'\n'}to scan QR codes.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>[ ALLOW CAMERA ]</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.cameraScreen}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.cameraOverlay}>
          <View style={styles.cameraFrame}>
            <ScanFrame />
          </View>
          <View style={styles.cameraBottom}>
            <Text style={styles.cameraHint}>POINT AT A QR CODE</Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setScanning(false)}>
              <Text style={styles.cancelText}>✕ CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // --- Home screen ---
  return (
    <View style={styles.screen}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, gap: 24, backgroundColor: theme.bg }}>
        <View style={styles.header}>
        </View>

<View style={styles.heroFrame}>
          <ScanFrame />
          <View style={{ position: 'absolute', top: 16, left: 16, zIndex: 3 }}>
            <QrLogo size={28} />
          </View>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 2 }}>
            <Text style={styles.heroTitle}>
              QUISHING{'\n'}DETECTOR{cursorVisible ? <Text style={{ color: theme.pink }}>_</Text> : null}
            </Text>
          </View>
          {/* pixels */}
          {[
            {l:10,t:10,s:8,o:0.9,c:theme.pink},
            {l:280,t:8,s:12,o:0.8,c:theme.accent},
            {l:150,t:5,s:10,o:0.85,c:theme.text},
            {l:5,t:100,s:16,o:0.5,c:theme.accent},
            {l:300,t:120,s:20,o:0.4,c:theme.pink},
            {l:20,t:200,s:24,o:0.3,c:theme.text},
            {l:260,t:210,s:48,o:0.15,c:theme.accent},
            {l:120,t:220,s:8,o:0.9,c:theme.pink},
            {l:80,t:10,s:14,o:0.7,c:theme.accent},
            {l:200,t:230,s:10,o:0.8,c:theme.text},
            {l:310,t:60,s:18,o:0.45,c:theme.pink},
            {l:0,t:160,s:12,o:0.75,c:theme.accent},
            {l:240,t:0,s:9,o:0.85,c:theme.text},
            {l:60,t:180,s:32,o:0.2,c:theme.pink},
            {l:140,t:90,s:8,o:0.9,c:theme.accent},
            {l:270,t:170,s:14,o:0.6,c:theme.text},
            {l:40,t:40,s:22,o:0.35,c:theme.pink},
            {l:190,t:130,s:11,o:0.7,c:theme.accent},
          ].map((p,i)=>(
            <View key={i} style={{position:'absolute',left:`${p.l}%`,top:`${p.t}%`,width:p.s,height:p.s,backgroundColor:p.c,opacity:p.o,zIndex:1}} pointerEvents="none" />
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.85}
          onPress={() => {
            if (!permission?.granted) requestPermission();
            setScanning(true);
          }}
        >
          <Text style={styles.primaryBtnText}>{'> '}INITIATE SCAN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          activeOpacity={0.8}
          onPress={handlePickImage}
        >
          <Text style={styles.secondaryBtnText}>{'> '}CHOOSE IMAGE</Text>
        </TouchableOpacity>

        <View style={styles.urlBlock}>
          <View style={styles.labelRow}>
            <View style={styles.labelTick} />
            <Text style={pixelLabel}>{'> '}OR PASTE URL</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="https://example.com"
              placeholderTextColor={theme.textMuted}
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleManual}
            />
            <TouchableOpacity style={styles.arrowBtn} activeOpacity={0.8} onPress={handleManual}>
              <Arrow size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Result */}
        <Modal visible={showModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
<Text style={pixelLabel}>TARGET_URL</Text>
              <Text style={styles.modalUrl}>
                {result?.original_url || scannedUrl || '—'}
              </Text>

              {loading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={theme.accent} />
                  <Text style={styles.loadingText}>ANALYZING...</Text>
                </View>
              )}

              {!loading && result?.error && (
                <Text style={styles.errorText}>{result.error}</Text>
              )}

              {!loading && result && !result.error && result.verdict && (
                <>
                  <View
                    style={[
                      styles.verdictBox,
                      {
                        borderColor:
                          result.verdict === 'malicious' ? theme.dangerLine : theme.safeLine,
                        backgroundColor:
                          result.verdict === 'malicious' ? theme.dangerSoft : theme.safeSoft,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.verdictBar,
                        {
                          backgroundColor:
                            result.verdict === 'malicious' ? theme.danger : theme.safe,
                        },
                      ]}
                    />
                    <View style={styles.verdictInner}>
                      <Text style={styles.verdictLabel}>SCAN_STATUS</Text>
                      <Text
                        style={[
                          styles.verdictText,
                          {
                            color:
                              result.verdict === 'malicious' || result.verdict === 'suspicious' ? theme.danger : theme.safe,
                          },
                        ]}
                      >
                        {result.verdict === 'malicious' || result.verdict === 'suspicious' ? '[ SUSPICIOUS ]' : '[ SAFE ]'}
                      </Text>
                      <Text style={styles.verdictScore}>
                        {'THREAT_LEVEL: '}{result.heuristics?.score ?? 0}/100
                      </Text>
                    </View>
                  </View>

                  {result.heuristics?.triggered_features?.length > 0 && (
                    <View style={styles.features}>
                      <Text style={styles.featuresTitle}>Triggered indicators</Text>
                      {result.heuristics.triggered_features.map((f: string, i: number) => (
                        <Text key={i} style={styles.featureItem}>— {f}</Text>
                      ))}
                    </View>
                  )}

                  {result.redirect?.hop_count > 0 && (
                    <View style={styles.features}>
                      <Text style={styles.featuresTitle}>
                        Redirects: {result.redirect.hop_count}
                      </Text>
                    </View>
                  )}

                  {result.virustotal && (
                    <View style={styles.features}>
                      <Text style={styles.featuresTitle}>VirusTotal</Text>
                     
                      {result.virustotal.total_engines > 0 ? (
                        <>
                          <Text style={styles.featureItem}>
                            Malicious: {result.virustotal.malicious} / {result.virustotal.total_engines}
                          </Text>
                          <Text style={styles.featureItem}>
                            Suspicious: {result.virustotal.suspicious}
                          </Text>
                          <Text style={styles.featureItem}>
                            Harmless: {result.virustotal.harmless}
                          </Text>
                          <Text style={styles.featureItem}>
                            Undetected: {result.virustotal.undetected}
                          </Text>
                          <Text style={styles.featureItem}>
                            Flagged: {result.virustotal.is_flagged ? 'Yes' : 'No'}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.featureItem}>
                          {result.virustotal.note || 'No engines reported'}
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity style={styles.closeBtn} activeOpacity={0.8} onPress={closeModal}>
                <Text style={styles.closeBtnText}>{'> '}CLOSE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}