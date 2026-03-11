import { Tabs } from 'expo-router';
import AppIcon from '../../../components/common/AppIcon';
import { colors } from '../../../constants/colors';
import { useTheme } from '../../../hooks/ThemeProvider';

const iconByRoute = {
  dashboard: 'LayoutDashboard',
  bills: 'Receipt',
  'add-bill': 'PlusCircle',
  'payment-history': 'CreditCard',
  profile: 'User',
};

export default function TabLayout() {
  const { themeId } = useTheme();

  return (
    <Tabs
      key={themeId}
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
          <AppIcon name={iconByRoute[route.name] ?? 'User'} size={Math.max(18, Math.min(22, size))} color={color} />
        ),
      })}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', href: '/dashboard' }} />
      <Tabs.Screen name="bills" options={{ title: 'Bills', href: '/bills' }} />
      <Tabs.Screen name="add-bill" options={{ title: 'Add Bill', href: '/add-bill' }} />
      <Tabs.Screen name="payment-history" options={{ title: 'Payments', href: '/payment-history' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', href: '/profile' }} />
    </Tabs>
  );
}
