/**
 * AppNavigator.tsx
 *
 * Root Navigation Stack gating.
 * Renders AuthStack (LoginScreen) or MainTabs + ClaimVehicleScreen.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { theme } from '../theme';
import { useLanguageStore } from '../store/languageStore';
import { translations } from '../constants/translations';

// Screens
import LoginScreen from '../screens/LoginScreen';
import GarageScreen from '../screens/GarageScreen';
import HistoryScreen from '../screens/HistoryScreen';
import AgenciesScreen from '../screens/AgenciesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ClaimVehicleScreen from '../screens/ClaimVehicleScreen';

export type MainTabParamList = {
  Garage: undefined;
  History: { vehicleId?: string } | undefined;
  Agencies: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  MainTabs: undefined;
  ClaimVehicle: { vehicleId: string };
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { language } = useLanguageStore();
  const t = translations[language];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = 'car';
          if (route.name === 'Garage') iconName = 'garage-variant';
          else if (route.name === 'History') iconName = 'history';
          else if (route.name === 'Agencies') iconName = 'map-marker';
          else if (route.name === 'Profile') iconName = 'account';

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: theme.colors.textPrimary,
          fontWeight: theme.typography.weights.bold,
        },
      })}
    >
      <Tab.Screen name="Garage" component={GarageScreen} options={{ title: t.garage }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: t.serviceHistory }} />
      <Tab.Screen name="Agencies" component={AgenciesScreen} options={{ title: t.centerFinder }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t.profile }} />
    </Tab.Navigator>
  );
}

interface AppNavigatorProps {
  isAuthenticated: boolean;
}

export default function AppNavigator({ isAuthenticated }: AppNavigatorProps) {
  const { language } = useLanguageStore();
  const t = translations[language];

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen 
            name="ClaimVehicle" 
            component={ClaimVehicleScreen} 
            options={{ 
              headerShown: true,
              headerTitle: t.claimVehicleHeader,
              headerStyle: { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border },
              headerTitleStyle: { color: theme.colors.textPrimary, fontWeight: theme.typography.weights.bold },
              headerTintColor: theme.colors.primary
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
