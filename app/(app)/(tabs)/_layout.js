import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { colors } from '../../../constants/colors';

const iconByRoute = {
  dashboard: 'home-outline',
  bills: 'receipt-outline',
  'add-bill': 'add-circle-outline',
  'payment-history': 'time-outline',
  profile: 'person-outline',
};

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="dashboard"
      screenOptions={({ route }) => ({
        sceneStyle: { backgroundColor: colors.background },
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: colors.textPrimary },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={iconByRoute[route.name] ?? 'ellipse-outline'} size={size} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="bills" options={{ title: 'Bills' }} />
      <Tabs.Screen name="add-bill" options={{ title: 'Add Bill' }} />
      <Tabs.Screen name="payment-history" options={{ title: 'Payments' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
