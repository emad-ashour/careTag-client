/**
 * ClaimVehicleScreen.tsx
 *
 * Handles claiming a vehicle via SMS Magic Link deep links (caryapp://claim/:vehicleId)
 * or NFC Tag tap (caryapp://vehicle/:vehicleId).
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGarageStore } from '../store/garageStore';
import { useAuthStore } from '../store/authStore';
import type { Vehicle } from '../db/clientDatabase';
import { theme } from '../theme';
import { useLanguageStore } from '../store/languageStore';
import { translations } from '../constants/translations';

export default function ClaimVehicleScreen({ route, navigation }: any) {
  const { vehicleId } = route.params || {};
  const { user } = useAuthStore();
  const { claimFromDeepLink } = useGarageStore();

  const [loading, setLoading] = useState(true);
  const [claimedVehicle, setClaimedVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { language } = useLanguageStore();
  const t = translations[language];
  const isRTL = language === 'ar';

  const rowDirection = isRTL ? 'row-reverse' : 'row';

  useEffect(() => {
    if (vehicleId && user?.id) {
      executeClaim(vehicleId, user.id);
    } else if (!vehicleId) {
      setError(language === 'ar' ? 'طلب مطالبة غير صالح. لم يتم تحديد معرف السيارة.' : 'Invalid claim request. No Vehicle ID specified.');
      setLoading(false);
    }
  }, [vehicleId, user]);

  const executeClaim = async (vehId: string, userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await claimFromDeepLink(vehId, userId);
      if (response.success && response.vehicle) {
        setClaimedVehicle(response.vehicle);
      } else {
        setError(t.claimFailedDetail);
      }
    } catch (e: any) {
      setError(e.message ?? t.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToGarage = () => {
    navigation.navigate('MainTabs', { screen: 'Garage' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t.claimingOwnership}</Text>
            <Text style={styles.loadingSubtext}>{t.restoringLogs}</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Icon name="alert-decagram" size={64} color={theme.colors.danger} />
            <Text style={styles.errorTitle}>{t.claimFailed}</Text>
            <Text style={styles.errorText}>{error}</Text>
            
            <TouchableOpacity style={styles.btnRetry} onPress={() => executeClaim(vehicleId, user!.id)}>
              <Text style={styles.btnRetryText}>{t.retryClaim}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={handleGoToGarage}>
              <Text style={styles.btnSecondaryText}>{t.garage}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.center}>
            <Icon name="check-decagram" size={72} color={theme.colors.primary} />
            <Text style={styles.successTitle}>{t.claimSuccessTitle}</Text>
            
            <View style={[styles.vehicleDetailsCard, { flexDirection: rowDirection }]}>
              <Icon name="car" size={36} color={theme.colors.primary} />
              <View style={[styles.detailsTextCol, { marginLeft: isRTL ? 0 : 16, marginRight: isRTL ? 16 : 0, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.vehicleName, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {claimedVehicle?.year} {claimedVehicle?.make} {claimedVehicle?.model}
                </Text>
                <Text style={[styles.vinText, { textAlign: isRTL ? 'right' : 'left' }]}>{t.vin}: {claimedVehicle?.vin}</Text>
                <Text style={[styles.plateText, { textAlign: isRTL ? 'right' : 'left' }]}>{t.plate}: {claimedVehicle?.license_plate}</Text>
              </View>
            </View>

            <Text style={styles.privacyCheckText}>
              {t.piiSeveredSuccess}{"\n"}
              {t.historySyncedSuccess}
            </Text>

            <TouchableOpacity style={styles.btnSuccess} onPress={handleGoToGarage}>
              <Text style={styles.btnSuccessText}>{t.viewInGarage}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  loadingText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    marginTop: 20,
  },
  loadingSubtext: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
    fontWeight: theme.typography.weights.medium,
  },
  errorTitle: {
    color: theme.colors.danger,
    fontSize: 22,
    fontWeight: theme.typography.weights.bold,
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 16,
    fontWeight: theme.typography.weights.medium,
  },
  btnRetry: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnRetryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
  btnSecondary: {
    borderColor: theme.colors.textSecondary,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 14,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
  successTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: theme.typography.weights.bold,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  vehicleDetailsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.card,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  detailsTextCol: {
    marginLeft: 16,
    flex: 1,
  },
  vehicleName: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
  },
  vinText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: theme.typography.weights.medium,
  },
  plateText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: theme.typography.weights.medium,
  },
  privacyCheckText: {
    color: theme.colors.primary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: theme.typography.weights.bold,
  },
  btnSuccess: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  btnSuccessText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
});
