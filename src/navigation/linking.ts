/**
 * linking.ts
 *
 * React Navigation deep link configuration.
 *
 * Supported schemes:
 *   caryapp://claim/:vehicleId   → ClaimVehicle screen (SMS magic link)
 *   caryapp://vehicle/:vehicleId → ClaimVehicle screen (NFC tag tap from B2B)
 *
 * Both paths funnel to the same ClaimVehicle screen because the intent is
 * identical: the user needs to claim ownership of this vehicle.
 */

import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';
import { DEEP_LINK_SCHEME } from '../constants/config';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${DEEP_LINK_SCHEME}://`],

  config: {
    screens: {
      MainTabs: {
        screens: {
          Garage: 'garage',
          History: 'history',
          Agencies: 'agencies',
          Profile: 'profile',
        },
      },
      ClaimVehicle: {
        path: 'claim/:vehicleId',
      },
    },
  },

  getStateFromPath(path, options) {
    const rewritten = path.replace(/^vehicle\//, 'claim/');
    const { getStateFromPath: defaultParser } = require('@react-navigation/native');
    return defaultParser(rewritten, options);
  },
};
