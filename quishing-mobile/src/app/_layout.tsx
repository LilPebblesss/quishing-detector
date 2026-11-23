import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
// Deep imports: the package root statically requires every weight it ships
// (~8 MB of TTFs), while only these weights are used by the UI.
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono/600SemiBold';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono/700Bold';
import { theme } from '../lib/styles';

SystemUI.setBackgroundColorAsync(theme.bg);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
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