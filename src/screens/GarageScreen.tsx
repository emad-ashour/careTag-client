/**
 * GarageScreen.tsx
 *
 * Multi-vehicle garage screen. Handles:
 *   - Displaying registered vehicles
 *   - Adding a new vehicle
 *   - Gating navigation to Service History
 *   - Gating the 4-step Secure Ownership Transfer state machine
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

export default function GarageScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { vehicles, isLoading, fetchGarage, addVehicle, removeVehicle } = useGarageStore();
  
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

  // Transfer 4-step state machine state
  // Steps: 1 (Disclaimer), 2 (Input Contact), 3 (Confirm), 4 (In Progress/Complete)
  const [transferStep, setTransferStep] = useState(1);
  const [newOwnerContact, setNewOwnerContact] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchGarage(user.id);
    }
  }, [user]);

  const handleAddVehicle = async () => {
    if (!make || !model || !year || !licensePlate || !vin || !mileage) {
      Alert.alert('Error', 'Please fill in all fields.');
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
        // Clear form
        setMake(''); setModel(''); setYear(''); setLicensePlate(''); setVin(''); setMileage('');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to add vehicle.');
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
      Alert.alert('Error', 'Please enter new owner contact details.');
      return;
    }
    setTransferStep(prev => prev + 1);
  };

  const handleExecuteTransfer = async () => {
    if (!selectedVehicle) return;

    setTransferLoading(true);
    setTransferStep(4); // Show progress/success screen
    try {
      const result = await performOwnershipTransfer(selectedVehicle.id, newOwnerContact);
      if (result.success) {
        // Success
        await fetchGarage(user!.id);
      } else {
        Alert.alert('Transfer Failed', result.message);
        setTransferModalVisible(false);
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred during transfer.');
      setTransferModalVisible(false);
    } finally {
      setTransferLoading(false);
    }
  };

  const renderVehicleCard = ({ item }: { item: Vehicle }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.cardTitle}>{item.year} {item.make} {item.model}</Text>
          <Text style={styles.cardSubtitle}>Plate: {item.license_plate} | VIN: {item.vin}</Text>
        </View>
        <Icon name="car" size={32} color={item.is_transferred ? theme.colors.textSecondary : theme.colors.primary} />
      </View>

      <View style={styles.cardSpecs}>
        <View style={styles.specItem}>
          <Icon name="speedometer" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.specText}>{item.mileage.toLocaleString()} km</Text>
        </View>
        <View style={styles.specItem}>
          <Icon name="calendar-sync" size={20} color={theme.colors.textSecondary} />
          <Text style={styles.specText}>
            {new Date(item.last_service_date).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {item.is_transferred === 1 && (
        <View style={styles.badgeTransferred}>
          <Icon name="swap-horizontal" size={14} color={theme.colors.primary} />
          <Text style={styles.badgeText}>Transferred Vehicle (PII Severed)</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('History', { vehicleId: item.id })}
        >
          <Icon name="clipboard-text-clock-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnDanger]}
          onPress={() => handleStartTransfer(item)}
        >
          <Icon name="account-arrow-right-outline" size={18} color={theme.colors.danger} />
          <Text style={[styles.actionBtnText, { color: theme.colors.danger }]}>Transfer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
              <Text style={styles.emptyText}>Your garage is empty.</Text>
              <Text style={styles.emptySubtext}>Add a vehicle to manage its reminders and services.</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading ? <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} /> : null
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Icon name="plus" size={30} color={theme.colors.white} />
      </TouchableOpacity>

      {/* ADD VEHICLE MODAL */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Vehicle</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContainer}>
              <Text style={styles.label}>Make</Text>
              <TextInput style={styles.input} placeholder="e.g. Tesla" placeholderTextColor={theme.colors.textSecondary} value={make} onChangeText={setMake} />
              
              <Text style={styles.label}>Model</Text>
              <TextInput style={styles.input} placeholder="e.g. Model 3" placeholderTextColor={theme.colors.textSecondary} value={model} onChangeText={setModel} />
              
              <Text style={styles.label}>Year</Text>
              <TextInput style={styles.input} placeholder="e.g. 2022" keyboardType="numeric" placeholderTextColor={theme.colors.textSecondary} value={year} onChangeText={setYear} />
              
              <Text style={styles.label}>License Plate</Text>
              <TextInput style={styles.input} placeholder="e.g. CT-382-X" autoCapitalize="characters" placeholderTextColor={theme.colors.textSecondary} value={licensePlate} onChangeText={setLicensePlate} />
              
              <Text style={styles.label}>VIN</Text>
              <TextInput style={styles.input} placeholder="17-character VIN" autoCapitalize="characters" placeholderTextColor={theme.colors.textSecondary} value={vin} onChangeText={setVin} />
              
              <Text style={styles.label}>Current Mileage (km)</Text>
              <TextInput style={styles.input} placeholder="e.g. 15000" keyboardType="numeric" placeholderTextColor={theme.colors.textSecondary} value={mileage} onChangeText={setMileage} />

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddVehicle}>
                <Text style={styles.submitBtnText}>Register Vehicle</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SECURE OWNERSHIP TRANSFER MODAL (4-Step State Machine) */}
      <Modal visible={transferModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Step 1: Warning / Disclaimer */}
            {transferStep === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.danger }]}>⚠️ Data Privacy Warning</Text>
                  <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
                    <Icon name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={styles.stepScroll}>
                  <Text style={styles.warningText}>
                    You are initiating a secure ownership transfer for:
                  </Text>
                  <Text style={styles.vehicleNameHighlight}>
                    {selectedVehicle?.year} {selectedVehicle?.make} {selectedVehicle?.model}
                  </Text>
                  
                  <View style={styles.warningBox}>
                    <Icon name="shield-alert-outline" size={24} color={theme.colors.danger} style={{ marginBottom: 8 }} />
                    <Text style={styles.warningBoxTitle}>Privacy & Severing Agreement</Text>
                    <Text style={styles.warningBoxBody}>
                      1. **PII Severed:** Your identity, contact details, technician names, and internal notes will be permanently erased.
                    </Text>
                    <Text style={styles.warningBoxBody}>
                      2. **History Truncated:** The new owner will only be able to view the last 5 service entries.
                    </Text>
                    <Text style={styles.warningBoxBody}>
                      3. **Irreversible:** Once confirmed, this vehicle will be removed from your garage.
                    </Text>
                  </View>

                  <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.danger }]} onPress={handleNextTransferStep}>
                    <Text style={styles.submitBtnText}>I Understand & Agree</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {/* Step 2: Input Contact */}
            {transferStep === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Enter New Owner Contact</Text>
                  <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
                    <Icon name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.stepContentBody}>
                  <Text style={styles.label}>New Owner's Phone or Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. +1 (555) 019-9234"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={newOwnerContact}
                    onChangeText={setNewOwnerContact}
                  />
                  <Text style={styles.helperText}>
                    We will send them a secure Magic Link to claim this vehicle under their account.
                  </Text>

                  <TouchableOpacity style={styles.submitBtn} onPress={handleNextTransferStep}>
                    <Text style={styles.submitBtnText}>Next Step</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 3: Confirmation */}
            {transferStep === 3 && (
              <View style={styles.stepContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Confirm Transfer</Text>
                  <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
                    <Icon name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <View style={styles.stepContentBody}>
                  <Text style={styles.warningText}>
                    Ready to transfer ownership of your vehicle to:
                  </Text>
                  <Text style={styles.contactHighlight}>{newOwnerContact}</Text>
                  <Text style={styles.warningSubtext}>
                    Clicking transfer will sever your connection to this vehicle's records.
                  </Text>

                  <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.colors.danger }]} onPress={handleExecuteTransfer}>
                    <Text style={styles.submitBtnText}>Execute Transfer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Step 4: Progress / Complete */}
            {transferStep === 4 && (
              <View style={[styles.stepContainer, { paddingVertical: 40 }]}>
                {transferLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.danger} />
                    <Text style={styles.loadingText}>Severing PII & truncating history...</Text>
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <Icon name="check-circle-outline" size={64} color={theme.colors.primary} />
                    <Text style={styles.successTitle}>Transfer Successful</Text>
                    <Text style={styles.successBody}>
                      The vehicle has been securely removed from your garage. The new owner can claim it using the SMS magic link.
                    </Text>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setTransferModalVisible(false)}>
                      <Text style={styles.closeBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

          </View>
        </View>
      </Modal>

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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 16,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: theme.typography.weights.medium,
    marginLeft: 8,
  },
  badgeTransferred: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1.5,
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  actionBtnDanger: {
    borderLeftColor: theme.colors.border,
    borderLeftWidth: 1.5,
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    flexDirection: 'row',
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
