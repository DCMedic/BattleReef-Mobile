import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { Brand } from '@/constants/theme';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

function icon(name: TabIconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons color={color} name={name} size={size} />;
  }
  TabIcon.displayName = `TabIcon(${name})`;
  return TabIcon;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: Brand.background },
        tabBarActiveTintColor: Brand.cyan,
        tabBarInactiveTintColor: Brand.textMuted,
        tabBarStyle: {
          backgroundColor: Brand.surface,
          borderTopColor: Brand.border,
          height: 66,
          paddingBottom: 8,
          paddingTop: 7,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: icon('home-outline') }}
      />
      <Tabs.Screen
        name="logbook"
        options={{ title: 'Logbook', tabBarIcon: icon('water-outline') }}
      />
      <Tabs.Screen
        name="tasks"
        options={{ title: 'Tasks', tabBarIcon: icon('checkmark-circle-outline') }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'More', tabBarIcon: icon('grid-outline') }}
      />
    </Tabs>
  );
}
