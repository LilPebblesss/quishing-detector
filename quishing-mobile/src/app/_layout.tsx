import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
// Deep imports: the package root statically requires every weight it ships
// (~8 MB of TTFs), while only these weights are used by the UI.
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p/400Regular';
import { VT323_400Regular } from '@expo-google-fonts/vt323/400Regular';
import { theme } from '../lib/styles';

SystemUI.setBackgroundColorAsync(theme.bg);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PressStart2P_400Regular,
    VT323_400Regular,
  });

  if (fontError) {
    // Render anyway so a font failure degrades to system fonts instead of a
    // permanently blank app.
    console.warn('Font loading failed, falling back to system fonts.', fontError);
  } else if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}