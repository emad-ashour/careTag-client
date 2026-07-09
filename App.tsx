/**
 * App.tsx — CareTag Consumer (B2C)
 *
 * Root component responsibilities:
 *   1. Hydrate auth session from Keychain on cold start
 *   2. Initialize SQLite database
 *   3. Initialize Notifee notification channels
 *   4. Request notification permissions
 *   5. Wire React Navigation with deep link config
 *   6. Gate rendering between AuthStack and MainTabs
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { linking } from './src/navigation/linking';
import { useAuthStore } from './src/store/authStore';
import { getClientDB } from './src/db/clientDatabase';
import {
  createNotificationChannels,
  requestNotificationPermissions,
} from './src/services/notificationService';

export default function App() {
  const { isAuthenticated, isLoading: authLoading, hydrateSession } = useAuthStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await getClientDB();
        await createNotificationChannels();
        await requestNotificationPermissions();
        await hydrateSession();
      } catch (err) {
        console.error('[App] Bootstrap error:', err);
      } finally {
        setAppReady(true);
      }
    };
    bootstrap();
  }, []);

  if (!appReady || authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#0D7A41" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <NavigationContainer linking={linking}>
          <AppNavigator isAuthenticated={isAuthenticated} />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
