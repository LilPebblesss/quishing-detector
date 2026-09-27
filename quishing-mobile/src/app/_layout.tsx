import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1e293b' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen name="index" options={{ title: '🛡️ Quishing Detector' }} />
    </Stack>
  );
}