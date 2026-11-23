import { StyleSheet } from 'react-native';

export const theme = {
  bg: '#0a0a0a',
  surface: '#0a0a0a',
  line: '#e8e8e8',
  lineStrong: '#e8e8e8',

  accent: '#00f0ff',
  accentSoft: 'rgba(0, 240, 255, 0.12)',
  accentLine: 'rgba(0, 240, 255, 0.40)',
  warning: '#00f0ff',
  safe: '#00f0ff',
  safeSoft: 'rgba(0, 240, 255, 0.10)',
  safeLine: 'rgba(0, 240, 255, 0.40)',
  danger: '#ff2a6d',
  dangerSoft: 'rgba(255, 42, 109, 0.10)',
  dangerLine: 'rgba(255, 42, 109, 0.40)',
  pink: '#ff2a6d',
  pinkShadow: '#ff2a6d',

  text: '#e8e8e8',
  textMuted: '#8a8a8a',

  borderWidth: 4,
  SHADOW_OFFSET_SMALL: 4,
  SHADOW_OFFSET_LARGE: 6,

  fontSemi: 'PressStart2P_400Regular',
  fontBold: 'PressStart2P_400Regular',
  mono: 'VT323_400Regular',
  monoMedium: 'VT323_400Regular',
} as const;

export const monoLabel = {
  fontFamily: theme.mono,
  fontSize: 18,
  lineHeight: 23.4,
  letterSpacing: 2,
  color: theme.textMuted,
  textTransform: 'uppercase',
} as const;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  container: { paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  brand: { marginLeft: 12, fontFamily: theme.fontBold, fontSize: 12, letterSpacing: 2.4, color: theme.accent, lineHeight: 20 },

  heroFrame: { width: '100%', aspectRatio: 1, marginTop: 28 },
  heroTitle: { fontFamily: theme.fontBold, fontSize: 22, lineHeight: 35.2, color: theme.text, textAlign: 'left' },
  heroGlow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, boxShadow: '0px 0px 10px 0px rgba(100, 255, 218, 0.30)', zIndex: 1 },

  primaryBtn: { height: 58, marginTop: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accent, borderWidth: theme.borderWidth, borderColor: '#ffffff', boxShadow: '6px 6px 0px 0px #ff2a6d', zIndex: 2 },
  primaryBtnText: { fontFamily: theme.fontBold, fontSize: 13, letterSpacing: 2.6, color: theme.bg, lineHeight: 21 },
  secondaryBtn: { height: 54, marginTop: 10, alignItems: 'center', justifyContent: 'center', borderWidth: theme.borderWidth, borderColor: theme.lineStrong, boxShadow: '4px 4px 0px 0px #ff2a6d' },
  secondaryBtnText: { fontFamily: theme.fontSemi, fontSize: 13, letterSpacing: 2.6, color: theme.accent, lineHeight: 21 },

  urlBlock: { marginTop: 32 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  labelTick: { width: 12, height: 1, marginRight: 8, backgroundColor: theme.accent },
  inputRow: { flexDirection: 'row' },
  input: { flex: 1, height: 52, paddingHorizontal: 14, backgroundColor: theme.surface, borderWidth: theme.borderWidth, borderRightWidth: 0, borderColor: theme.lineStrong, color: theme.accent, fontFamily: theme.mono, fontSize: 18, lineHeight: 23.4, borderRadius: 0 },
  arrowBtn: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentSoft, borderWidth: theme.borderWidth, borderColor: theme.accentLine },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: theme.bg },
  permText: { fontFamily: theme.mono, fontSize: 18, lineHeight: 23.4, textAlign: 'center', color: theme.textMuted, marginBottom: 24 },
  permBtn: { paddingHorizontal: 28, paddingVertical: 15, backgroundColor: theme.accent, borderRadius: 0, borderWidth: theme.borderWidth, borderColor: '#ffffff', boxShadow: '4px 4px 0px 0px #ff2a6d' },
  permBtnText: { fontFamily: theme.fontBold, fontSize: 12, letterSpacing: 2.4, color: theme.bg, lineHeight: 20 },

  cameraScreen: { flex: 1, backgroundColor: theme.bg },
  cameraOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', pointerEvents: 'box-none' },
  cameraFrame: { width: '78%', aspectRatio: 1 },
  cameraBottom: { position: 'absolute', left: 0, right: 0, bottom: 48, alignItems: 'center' },
  cameraHint: { fontFamily: theme.fontSemi, fontSize: 12, letterSpacing: 3, color: theme.text, marginBottom: 22, lineHeight: 20 },
  cancelBtn: { paddingHorizontal: 26, paddingVertical: 14, backgroundColor: 'rgba(10,25,47,0.85)', borderWidth: theme.borderWidth, borderColor: theme.lineStrong, borderRadius: 0, boxShadow: '4px 4px 0px 0px #ff2a6d' },
  cancelText: { fontFamily: theme.monoMedium, fontSize: 18, letterSpacing: 2, color: theme.text, lineHeight: 23.4 },

  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(10, 10, 10, 0.85)' },
  modalContent: { padding: 24, backgroundColor: theme.surface, borderWidth: theme.borderWidth, borderColor: theme.lineStrong, borderRadius: 0, boxShadow: '6px 6px 0px 0px #ff2a6d', gap: 24 },
  modalUrl: { marginTop: 8, padding: 12, backgroundColor: theme.bg, borderWidth: theme.borderWidth, borderColor: theme.line, fontFamily: theme.mono, fontSize: 18, lineHeight: 23.4, color: theme.accent, borderRadius: 0, },
  loadingRow: { alignItems: 'center', marginTop: 24 },
  loadingText: { marginTop: 10, fontFamily: theme.mono, fontSize: 18, letterSpacing: 2, color: theme.warning, lineHeight: 23.4 },
  errorText: { marginTop: 20, fontFamily: theme.mono, fontSize: 18, lineHeight: 23.4, color: theme.danger },
  verdictBox: { flexDirection: 'row', marginTop: 0, borderWidth: theme.borderWidth, borderRadius: 0, boxShadow: '4px 4px 0px 0px #ff2a6d' },
  verdictBar: { width: 8, alignSelf: 'stretch' },
  verdictInner: { flex: 1, padding: 16, gap: 8 },
  verdictLabel: { fontFamily: theme.fontSemi, fontSize: 12, letterSpacing: 1, color: theme.textMuted, lineHeight: 20 },
  verdictText: { fontFamily: theme.fontBold, fontSize: 22, letterSpacing: 3, lineHeight: 36 },
  verdictScore: { marginTop: 6, fontFamily: theme.mono, fontSize: 18, letterSpacing: 1.4, color: theme.textMuted, lineHeight: 23.4 },
  features: { marginTop: 0, gap: 4 },
  featuresTitle: { fontFamily: theme.monoMedium, fontSize: 16, letterSpacing: 2, color: theme.textMuted, textTransform: 'uppercase', marginBottom: 8, lineHeight: 20.8 },
  featureItem: { fontFamily: theme.mono, fontSize: 18, lineHeight: 23.4, color: theme.text },
  closeBtn: { height: 50, marginTop: 0, alignItems: 'center', justifyContent: 'center', borderWidth: theme.borderWidth, borderColor: theme.lineStrong, borderRadius: 0, backgroundColor: 'transparent', boxShadow: '4px 4px 0px 0px #ff2a6d' },
  closeBtnText: { fontFamily: theme.fontSemi, fontSize: 13, letterSpacing: 2.8, color: theme.lineStrong, lineHeight: 21 },
});

export const pixelLabel = {
  fontFamily: theme.fontSemi,
  fontSize: 11,
  lineHeight: 18,
  letterSpacing: 1,
  color: theme.textMuted,
} as const;
