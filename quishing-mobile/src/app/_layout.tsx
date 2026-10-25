import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
// Deep imports: the package root statically requires every weight it ships
// (~8 MB of TTFs), while only these weights are used by the UI.
import { SpaceGrotesk_600SemiBold } from '@expo-google-fonts/space-grotesk/600SemiBold';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono/400Regular';
import { IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono/500Medium';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono/600SemiBold';
import { theme } from '../lib/styles';

SystemUI.setBackgroundColorAsync(theme.bg);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
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