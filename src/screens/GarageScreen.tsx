/**
 * GarageScreen.tsx
 *
 * Multi-vehicle garage screen with license quota gating, lock overlay,
 * and dynamic Paywall modal integration.
 * Conforms strictly to the high-contrast light theme.
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGarageStore } from '../store/garageStore';
import { useAuthStore } from '../store/authStore';
import { performOwnershipTransfer } from '../services/transferService';
import type { Vehicle } from '../db/clientDatabase';
import { theme } from '../theme';
import { useLanguageStore } from '../store/languageStore';
import { translations } from '../constants/translations';
import PaywallModal from '../components/PaywallModal';

export default function GarageScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const { vehicles, isLoading, fetchGarage, addVehicle } = useGarageStore();
  
  // Quota & Paywall State
  const quota = user?.license_quota ?? 1;
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallVehicle, setPaywallVehicle] = useState<Vehicle | null>(null);

  // Modals state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // New vehicle form state
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState('');

  // Transfer state machine
  const [transferStep, setTransferStep] = useState(1);
  const [newOwnerContact, setNewOwnerContact] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const { language } = useLanguageStore();
  const t = translations[language];
  const isRTL = language === 'ar';

  const rowDirection = isRTL ? 'row-reverse' : 'row';
  const textAlign = isRTL ? 'right' : 'left';

  useEffect(() => {
    if (user?.id) {
      fetchGarage(user.id);
    }
  }, [user]);

  // Handle deep-link parameters for newly claimed over-quota vehicles
  useEffect(() => {
    if (route.params?.highlightLockedVehicleId && vehicles.length > 0) {
      const targetId = route.params.highlightLockedVehicleId;
      const targetIndex = vehicles.findIndex(v => v.id === targetId);
      
      if (targetIndex >= quota) {
        setPaywallVehicle(vehicles[targetIndex]);
        setPaywallVisible(true);
        navigation.setParams({ highlightLockedVehicleId: undefined });
      }
    }
  }, [route.params, vehicles, quota]);

  const handleAddVehicle = async () => {
    if (!make || !model || !year || !licensePlate || !vin || !mileage) {
      Alert.alert(t.error, t.fillAllFields);
      return;
    }

    try {
      const newVeh = {
        id: `veh-${Date.now()}`,
        make,
        model,
        year: parseInt(year, 10),
        license_plate: licensePlate,
        vin,
        mileage: parseInt(mileage, 10),
        last_service_date: new Date().toISOString(),
        is_transferred: 0,
      };

      if (user?.id) {
        await addVehicle(newVeh, user.id);
        setAddModalVisible(false);
        setMake(''); setModel(''); setYear(''); setLicensePlate(''); setVin(''); setMileage('');
        
        const updatedVehiclesLength = vehicles.length + 1;
        if (updatedVehiclesLength > quota) {
          const newVehObj: Vehicle = { ...newVeh, owner_user_id: user.id, claimed_at: new Date().toISOString() };
          setPaywallVehicle(newVehObj);
          setPaywallVisible(true);
        }
      }
    } catch (e) {
      Alert.alert(t.error, t.errorAddVehicle);
    }
  };

  const handleStartTransfer = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setTransferStep(1);
    setNewOwnerContact('');
    setTransferModalVisible(true);
  };

  const handleNextTransferStep = () => {
    if (transferStep === 2 && !newOwnerContact.trim()) {
      Alert.alert(t.error, t.enterNewOwnerContactError);
      return;
    }
    setTransferStep(prev => prev + 1);
  };

  const handleExecuteTransfer = async () => {
    if (!selectedVehicle) return;

    setTransferLoading(true);
    setTransferStep(4);
    try {
      const result = await performOwnershipTransfer(selectedVehicle.id, newOwnerContact);
      if (result.success) {
        await fetchGarage(user!.id);
      } else {
        Alert.alert(t.transferFailed, result.message);
        setTransferModalVisible(false);
      }
    } catch (e) {
      Alert.alert(t.error, t.unexpectedError);
      setTransferModalVisible(false);
    } finally {
      setTransferLoading(false);
    }
  };

  const renderVehicleCard = ({ item, index }: { item: Vehicle; index: number }) => {
    const isLocked = index >= quota;

    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, isLocked && styles.cardLocked]}>
          <View style={[styles.cardHeader, { flexDirection: rowDirection }]}>
            <View style={{ flex: 1, paddingRight: isRTL ? 0 : 8, paddingLeft: isRTL ? 8 : 0 }}>
              <Text style={[styles.cardTitle, { textAlign }]}>{item.year} {item.make} {item.model}</Text>
              <Text style={[styles.cardSubtitle, { textAlign }]}>{t.plate}: {item.license_plate} | {t.vin}: {item.vin}</Text>
            </View>
            <Icon name="car" size={32} color={isLocked ? theme.colors.textSecondary : theme.colors.primary} />
          </View>

          <View style={[styles.cardSpecs, { flexDirection: rowDirection }]}>
            <View style={[styles.specItem, { flexDirection: rowDirection }]}>
              <Icon name="speedometer" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.specText, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                {item.mileage.toLocaleString()} km
              </Text>
            </View>
            <View style={[styles.specItem, { flexDirection: rowDirection }]}>
              <Icon name="calendar-sync" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.specText, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                {new Date(item.last_service_date).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {item.is_transferred === 1 && (
            <View style={[styles.badgeTransferred, { flexDirection: rowDirection }]}>
              <Icon name="swap-horizontal" size={14} color={theme.colors.primary} />
              <Text style={[styles.badgeText, { marginLeft: isRTL ? 0 : 6, marginRight: isRTL ? 6 : 0 }]}>{t.transferredVehicle}</Text>
            </View>
          )}

          <View style={[styles.cardActions, { flexDirection: rowDirection }]}>
            <TouchableOpacity
              style={[styles.actionBtn, { flexDirection: rowDirection }]}
              onPress={() => {
                if (isLocked) {
                  setPaywallVehicle(item);
                  setPaywallVisible(true);
                } else {
                  navigation.navigate('History', { vehicleId: item.id });
                }
              }}
            >
              <Icon name={isLocked ? 'lock' : 'clipboard-text-clock-outline'} size={18} color={isLocked ? theme.colors.danger : theme.colors.primary} />
              <Text style={[styles.actionBtnText, { color: isLocked ? theme.colors.danger : theme.colors.primary, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
                {isLocked ? (isRTL ? 'مغلق - انقر لفتح القفل' : 'Locked - Tap to Unlock') : t.history}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                { 
                  flexDirection: rowDirection,
                  borderLeftColor: isRTL ? 'transparent' : theme.colors.border,
                  borderLeftWidth: isRTL ? 0 : 1.5,
                  borderRightColor: isRTL ? theme.colors.border : 'transparent',
                  borderRightWidth: isRTL ? 1.5 : 0,
                }
              ]}
              onPress={() => {
                if (isLocked) {
                  setPaywallVehicle(item);
                  setPaywallVisible(true);
                } else {
                  handleStartTransfer(item);
                }
              }}
            >
              <Icon name="account-arrow-right-outline" size={18} color={theme.colors.danger} />
              <Text style={[styles.actionBtnText, { color: theme.colors.danger, marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>{t.transfer}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lock Overlay */}
        {isLocked && (
          <TouchableOpacity 
            style={styles.lockOverlay} 
            activeOpacity={0.9} 
            onPress={() => {
              setPaywallVehicle(item);
              setPaywallVisible(true);
            }}
          >
            <View style={styles.lockBanner}>
              <Icon name="lock" size={24} color="#FFFFFF" />
              <Text style={styles.lockBannerText}>
                {isRTL ? 'انقر لفتح قفل سجلات السيارة' : 'Unlock Vehicle Records'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={item => item.id}
        renderItem={renderVehicleCard}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Icon name="garage" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>{t.emptyGarage}</Text>
              <Text style={styles.emptySubtext}>{t.emptyGarageSub}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading ? <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} /> : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Icon name="plus" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ADD VEHICLE MODAL */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { flexDirection: rowDirection }]}>
              <Text style={styles.modalTitle}>{t.addVehicle}</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
              <Text style={[styles.label, { textAlign }]}>{t.make}</Text>
              <TextInput style={[styles.input, { textAlign }]} placeholder={t.makePlaceholder} placeholderTextColor={theme.colors.textSecondary} value={make} onChangeText={setMake} />
              
              <Text style={[styles.label, { textAlign }]}>{t.model}</Text>
              <TextInput style={[styles.input, { textAlign }]} placeholder={t.modelPlaceholder} placeholderTextColor={theme.colors.textSecondary} value={model} onChangeText={setModel} />
              
              <Text style={[styles.label, { textAlign }]}>{t.year}</Text>
              <TextInput style={[styles.input, { textAlign }]} placeholder={t.yearPlaceholder} keyboardType="numeric" placeholderTextColor={theme.colors.textSecondary} value={year} onChangeText={setYear} />
              
              <Text style={[styles.label, { textAlign }]}>{t.licensePlate}</Text>
              <TextInput style={[styles.input, { textAlign }]} placeholder={t.licensePlatePlaceholder} autoCapitalize="characters" placeholderTextColor={theme.colors.textSecondary} value={licensePlate} onChangeText={setLicensePlate} />
              
              <Text style={[styles.label, { textAlign }]}>{t.vin}</Text>
              <TextInput style={[styles.input, { textAlign }]} placeholder={t.vinPlaceholder} autoCapitalize="characters" placeholderTextColor={theme.colors.textSecondary} value={vin} onChangeText={setVin} />
              
              <Text style={[styles.label, { textAlign }]}>{t.currentMileage}</Text>
              <TextInput style={[styles.input, { textAlign }]} placeholder={t.mileagePlaceholder} keyboardType="numeric" placeholderTextColor={theme.colors.textSecondary} value={mileage} onChangeText={setMileage} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddVehicle}>
                <Text style={styles.submitBtnText}>{t.registerVehicle}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* OWNERSHIP TRANSFER MODAL */}
      <Modal visible={transferModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {transferStep === 1 && (
              <View style={styles.stepContainer}>
                <View style={[styles.modalHeader, { flexDirection: rowDirection }]}>
                  <Text style={[styles.modalTitle, { color: theme.colors.danger }]}>{t.dataPrivacyWarning}</Text>
                  <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
                    <Icon name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.stepScroll}>
                  <Text style={[styles.warningText, { textAlign }]}>{t.transferInitiateNotice}</Text>
                  <Text style={[styles.vehicleNameHighlight, { textAlign }]}>{selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}</Text>
                  <View style={styles.warningBox}>
                    <Icon name="shield-alert-outline" size={24} color={theme.colors.danger} style={{ marginBottom: 8, alignSelf: isRTL ? 'flex-end' : 'flex-start' }} />
                    <Text style={[styles.warningBoxTitle, { textAlign }]}>{t.privacyAgreementTitle}</Text>
                    <Text style={[styles.warningBoxBody, { textAlign }]}>{t.piiSeveredDesc}</Text>
                    <Text style={[styles.warningBoxBody, { textAlign }]}>{t.historyTruncatedDesc}</Text>
                    <Text style={[styles.warningBoxBody, { textAlign }]}>{t.irreversibleDesc}</Text>
                  </View>
                  <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.danger }]} onPress={handleNextTransferStep}>
                    <Text style={styles.submitBtnText}>{t.understandAgree}</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {transferStep === 2 && (
              <View style={styles.stepContainer}>
                <View style={[styles.modalHeader, { flexDirection: rowDirection }]}>
                  <Text style={styles.modalTitle}>{t.newOwnerContact}</Text>
                  <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
                    <Icon name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.stepContentBody}>
                  <Text style={[styles.label, { textAlign }]}>{t.newOwnerPhoneEmail}</Text>
                  <TextInput style={[styles.input, { textAlign }]} placeholder={t.newOwnerContactPlaceholder} placeholderTextColor={theme.colors.textSecondary} value={newOwnerContact} onChangeText={setNewOwnerContact} />
                  <Text style={[styles.helperText, { textAlign }]}>{t.magicLinkNotice}</Text>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleNextTransferStep}>
                    <Text style={styles.submitBtnText}>{t.nextStep}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {transferStep === 3 && (
              <View style={styles.stepContainer}>
                <View style={[styles.modalHeader, { flexDirection: rowDirection }]}>
                  <Text style={styles.modalTitle}>{t.confirmTransfer}</Text>
                  <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
                    <Icon name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.stepContentBody}>
                  <Text style={[styles.warningText, { textAlign }]}>{t.readyTransferNotice}</Text>
                  <Text style={[styles.contactHighlight, { textAlign }]}>{newOwnerContact}</Text>
                  <Text style={[styles.warningSubtext, { textAlign }]}>{t.severNotice}</Text>
                  <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.danger }]} onPress={handleExecuteTransfer}>
                    <Text style={styles.submitBtnText}>{t.executeTransfer}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {transferStep === 4 && (
              <View style={[styles.stepContainer, { paddingVertical: 40 }]}>
                {transferLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.danger} />
                    <Text style={styles.loadingText}>{t.severingPiiProgress}</Text>
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <Icon name="check-circle-outline" size={64} color={theme.colors.primary} />
                    <Text style={styles.successTitle}>{t.transferSuccessful}</Text>
                    <Text style={styles.successBody}>{t.transferSuccessDetail}</Text>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setTransferModalVisible(false)}>
                      <Text style={styles.closeBtnText}>{t.done}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* DYNAMIC ILS PAYWALL MODAL */}
      <PaywallModal
        visible={paywallVisible}
        onClose={() => {
          setPaywallVisible(false);
          setPaywallVehicle(null);
        }}
        onSuccess={() => {
          setPaywallVisible(false);
          setPaywallVehicle(null);
          if (user?.id) fetchGarage(user.id);
        }}
        vehicleName={paywallVehicle ? `${paywallVehicle.year} ${paywallVehicle.make} ${paywallVehicle.model}` : 'Selected Vehicle'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loader: {
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    marginTop: 16,
  },
  emptySubtext: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
    fontWeight: theme.typography.weights.medium,
  },
  cardContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
  },
  cardLocked: {
    opacity: 0.35,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: theme.borderRadius.card,
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary, // Forest Green locked badge
    borderRadius: theme.borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  lockBannerText: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.bold,
    marginLeft: 8,
    fontSize: 14,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: theme.typography.weights.medium,
  },
  cardSpecs: {
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  specItem: {
    alignItems: 'center',
  },
  specText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: theme.typography.weights.medium,
    marginLeft: 8,
  },
  badgeTransferred: {
    alignItems: 'center',
    backgroundColor: theme.colors.highlight,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    marginLeft: 6,
  },
  cardActions: {
    justifyContent: 'space-between',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1.5,
    paddingTop: 12,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: theme.colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 30,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
  },
  modalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1.5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
  },
  formContainer: {
    padding: 20,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.textPrimary,
    borderRadius: theme.borderRadius.input,
    padding: 14,
    marginBottom: 20,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
  stepContainer: {
    paddingHorizontal: 4,
  },
  stepScroll: {
    padding: 20,
  },
  stepContentBody: {
    padding: 20,
  },
  warningText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginBottom: 8,
    fontWeight: theme.typography.weights.medium,
  },
  vehicleNameHighlight: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 20,
  },
  warningBox: {
    backgroundColor: theme.colors.dangerBg,
    borderColor: theme.colors.danger,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  warningBoxTitle: {
    color: theme.colors.danger,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    marginTop: 8,
    marginBottom: 12,
  },
  warningBoxBody: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
    fontWeight: theme.typography.weights.medium,
  },
  helperText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginTop: -8,
    marginBottom: 24,
    fontWeight: theme.typography.weights.medium,
  },
  contactHighlight: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: theme.typography.weights.bold,
    marginVertical: 12,
  },
  warningSubtext: {
    color: theme.colors.danger,
    fontSize: 13,
    marginBottom: 24,
    fontWeight: theme.typography.weights.bold,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginTop: 16,
    fontWeight: theme.typography.weights.medium,
  },
  successTitle: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: theme.typography.weights.bold,
    marginTop: 20,
    marginBottom: 10,
  },
  successBody: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: theme.typography.weights.medium,
  },
  closeBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
});
