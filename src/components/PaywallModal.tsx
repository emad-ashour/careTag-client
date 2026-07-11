/**
 * PaywallModal.tsx
 *
 * Bottom sheet style modal that pops up when user tries to access/view a locked vehicle.
 * Dynamically queries pricing_tiers table in Supabase for current price.
 * Follows the high-contrast light theme.
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme';
import { supabase } from '../services/supabase';
import { USE_MOCK_API } from '../constants/config';
import { useAuthStore } from '../store/authStore';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicleName: string;
}

export default function PaywallModal({ visible, onClose, onSuccess, vehicleName }: PaywallModalProps) {
  const { user, updateUserQuota } = useAuthStore();
  const [price, setPrice] = useState<number>(29.99); // default fallback price in ILS
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchPrice();
    }
  }, [visible]);

  const fetchPrice = async () => {
    setLoading(true);
    try {
      if (USE_MOCK_API) {
        await new Promise(r => setTimeout(r, 400));
        setPrice(19.99);
      } else {
        const { data, error } = await supabase
          .from('pricing_tiers')
          .select('price_ils')
          .eq('tier_name', 'extra_license')
          .single();

        if (error) throw error;
        if (data?.price_ils) {
          setPrice(data.price_ils);
        }
      }
    } catch (err) {
      console.warn('[PaywallModal] Failed to fetch dynamic price from Supabase, using fallback:', err);
      setPrice(25.00); // stable fallback ILS price
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    setPaymentLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      
      const newQuota = (user?.license_quota ?? 1) + 1;

      if (!USE_MOCK_API && user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ license_quota: newQuota })
          .eq('id', user.id);

        if (error) throw error;
      }

      updateUserQuota(newQuota);

      Alert.alert(
        'Payment Successful',
        'Your new license is active. The vehicle has been unlocked!'
      );
      onSuccess();
    } catch (err: any) {
      Alert.alert('Payment Error', err.message ?? 'Failed to complete transaction.');
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Unlock Premium Access</Text>
            <TouchableOpacity onPress={onClose} disabled={paymentLoading}>
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            <View style={styles.iconContainer}>
              <Icon name="lock-open-outline" size={64} color={theme.colors.primary} />
            </View>

            <Text style={styles.title}>License Quota Reached</Text>
            <Text style={styles.vehicleSubtitle}>{vehicleName}</Text>

            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={styles.priceLoader} />
            ) : (
              <Text style={styles.description}>
                Unlock this vehicle's maintenance history and reminders for just <Text style={styles.priceHighlight}>{price} ILS</Text>.
              </Text>
            )}

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Icon name="check" size={18} color={theme.colors.primary} />
                <Text style={styles.featureText}>Full Service Log Access</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check" size={18} color={theme.colors.primary} />
                <Text style={styles.featureText}>Automatic Maintenance Reminders</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="check" size={18} color={theme.colors.primary} />
                <Text style={styles.featureText}>PII-Severed Ownership Transfers</Text>
              </View>
            </View>

            {/* Pay Button */}
            {paymentLoading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
              <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
                <Text style={styles.checkoutBtnText}>Pay with Local Gateway</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.secureNotice}>
              <Icon name="shield-check" size={12} color={theme.colors.textSecondary} /> Secured by local payment operators
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // high contrast slate transparent overlay
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background, // Pure White
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
  },
  body: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: theme.typography.weights.bold,
    textAlign: 'center',
  },
  vehicleSubtitle: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  priceLoader: {
    marginVertical: 12,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  priceHighlight: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  featuresList: {
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surface, // Off white
    borderRadius: theme.borderRadius.card,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  featureText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    marginLeft: 10,
    fontWeight: theme.typography.weights.medium,
  },
  loader: {
    marginVertical: 16,
  },
  checkoutBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    height: 52,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBtnText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
  secureNotice: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
});
