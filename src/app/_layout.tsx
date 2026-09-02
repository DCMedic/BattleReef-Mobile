import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { migrateDatabase } from '@/data/database';
import { AppDataProvider } from '@/providers/app-data-provider';

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
          <Stack screenOptions={{ contentStyle: { backgroundColor: '#061522' }, headerStyle: { backgroundColor: '#0B2234' }, headerTintColor: '#F3FAFD', headerShadowVisible: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="aquarium/new" options={{ title: 'Add aquarium', presentation: 'modal' }} />
            <Stack.Screen name="reading/new" options={{ title: 'Log water test', presentation: 'modal' }} />
            <Stack.Screen name="task/new" options={{ title: 'Add task', presentation: 'modal' }} />
            <Stack.Screen name="event/new" options={{ title: 'Log activity', presentation: 'modal' }} />
            <Stack.Screen name="targets" options={{ title: 'Parameter targets' }} />
            <Stack.Screen name="analysis/change" options={{ title: 'What changed?' }} />
          </Stack>
        </ThemeProvider>
      </AppDataProvider>
    </SQLiteProvider>
  );
}
