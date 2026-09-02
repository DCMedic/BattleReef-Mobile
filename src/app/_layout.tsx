import * as Notifications from 'expo-notifications';
import { DarkTheme, Stack, ThemeProvider, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrateDatabase } from '@/data/database';
import { AppDataProvider } from '@/providers/app-data-provider';

function NotificationNavigation() {
  const router = useRouter();

  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse | null) {
      if (response?.notification.request.content.data?.route === '/tasks') {
        router.push('/tasks');
      }
    }

    void Notifications.getLastNotificationResponseAsync().then(handleResponse);
    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => subscription.remove();
  }, [router]);

  return null;
}

const battleReefTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: '#19BCEB', background: '#061522', card: '#0B2234', border: '#163B50', text: '#F3FAFD', notification: '#3BD49B' },
};

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="battlereef.db" onInit={migrateDatabase}>
      <AppDataProvider>
        <ThemeProvider value={battleReefTheme}>
          <StatusBar style="light" />
          <NotificationNavigation />
          <Stack screenOptions={{ contentStyle: { backgroundColor: '#061522' }, headerStyle: { backgroundColor: '#0B2234' }, headerTintColor: '#F3FAFD', headerShadowVisible: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="aquarium/new" options={{ title: 'Add aquarium', presentation: 'modal' }} />
            <Stack.Screen name="reading/new" options={{ title: 'Log water test', presentation: 'modal' }} />
            <Stack.Screen name="task/new" options={{ title: 'Add task', presentation: 'modal' }} />
            <Stack.Screen name="event/new" options={{ title: 'Log activity', presentation: 'modal' }} />
            <Stack.Screen name="targets" options={{ title: 'Parameter targets' }} />
            <Stack.Screen name="analysis/change" options={{ title: 'What changed?' }} />
            <Stack.Screen name="analysis/trend" options={{ title: 'Parameter trend' }} />
            <Stack.Screen name="analysis/advisory" options={{ title: 'Advisory' }} />
            <Stack.Screen name="livestock/new" options={{ title: 'Add livestock', presentation: 'modal' }} />
            <Stack.Screen name="equipment/new" options={{ title: 'Add equipment', presentation: 'modal' }} />
            <Stack.Screen name="livestock/[id]" options={{ title: 'Livestock' }} />
            <Stack.Screen name="equipment/[id]" options={{ title: 'Equipment' }} />
            <Stack.Screen name="photos" options={{ title: 'Photos' }} />
            <Stack.Screen name="photo/new" options={{ title: 'Add photo', presentation: 'modal' }} />
            <Stack.Screen name="photo/compare" options={{ title: 'Compare photos' }} />
            <Stack.Screen name="photo/series" options={{ title: 'Visual history' }} />
            <Stack.Screen name="backup/restore" options={{ title: 'Restore backup' }} />
          </Stack>
        </ThemeProvider>
      </AppDataProvider>
    </SQLiteProvider>
  );
}
