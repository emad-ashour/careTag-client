/**
 * index.js — CareTag Consumer App entry point
 */
import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  const { notification } = detail;
  if (type === EventType.DISMISSED && notification?.id) {
    console.log('[Notifee BG] Notification dismissed:', notification.id);
  }
});

AppRegistry.registerComponent(appName, () => App);
