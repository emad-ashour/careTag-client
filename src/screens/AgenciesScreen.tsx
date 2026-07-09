/**
 * AgenciesScreen.tsx
 *
 * Center Finder & Rating engine.
 * Displays nearby authorized CareTag centers on a dark-themed MapView,
 * sorted by GPS proximity. Handles offline-first 5-star ratings.
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
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { requestLocationPermission, getCurrentPosition, distanceKm, type Coordinates } from '../services/locationService';
import { fetchAgencies, submitRating, type Agency } from '../services/apiClient';
import { insertOfflineRating, getUnsyncedRatings, markRatingSynced } from '../db/clientDatabase';
import { theme } from '../theme';

export default function AgenciesScreen() {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Rating Modal state
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    bootstrapLocationAndAgencies();
    // Attempt to sync any unsynced ratings from previous sessions
    syncOfflineRatings();
  }, []);

  const bootstrapLocationAndAgencies = async () => {
    setLoading(true);
    let coords: Coordinates | null = null;
    try {
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        coords = await getCurrentPosition();
        setUserLocation(coords);
      }
    } catch (e) {
      console.warn('[AgenciesScreen] Could not fetch GPS location:', e);
    }

    try {
      const list = await fetchAgencies();
      
      // Calculate distances and sort if location is available
      if (coords) {
        const withDistance = list.map(agency => ({
          ...agency,
          distance: distanceKm(
            coords!.latitude,
            coords!.longitude,
            agency.latitude,
            agency.longitude,
          ),
        }));
        // Sort by closest distance
        withDistance.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
        setAgencies(withDistance);
      } else {
        setAgencies(list);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to retrieve CareTag agencies.');
    } finally {
      setLoading(false);
    }
  };

  const syncOfflineRatings = async () => {
    try {
      const unsynced = await getUnsyncedRatings();
      for (const item of unsynced) {
        try {
          const res = await submitRating(item.agency_id, item.rating, item.comment);
          if (res.success) {
            await markRatingSynced(item.id);
            console.log(`[AgenciesScreen] Synced offline rating: ${item.id}`);
          }
        } catch (err) {
          // Keep offline, will retry next start
          console.warn(`[AgenciesScreen] Failed to sync offline rating ${item.id}:`, err);
        }
      }
    } catch (e) {
      console.warn('[AgenciesScreen] Error running offline sync:', e);
    }
  };

  const handleOpenRatingModal = (agency: Agency) => {
    setSelectedAgency(agency);
    setScore(5);
    setComment('');
    setRatingModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedAgency) return;

    setSubmittingRating(true);
    const ratingId = `rat-${Date.now()}`;
    const newRating = {
      id: ratingId,
      agency_id: selectedAgency.id,
      rating: score,
      comment,
    };

    try {
      // 1. Save locally to DB first (Offline-First)
      await insertOfflineRating(newRating);
      
      // 2. Clear Modal early for better UX
      setRatingModalVisible(false);
      Alert.alert('Thank You', 'Your rating was saved locally and will sync in the background.');

      // 3. Attempt API sync inline
      const res = await submitRating(selectedAgency.id, score, comment);
      if (res.success) {
        await markRatingSynced(ratingId);
      }
    } catch (error) {
      // Network error, keeps offline status in DB
      console.log('[AgenciesScreen] Saved rating offline due to network:', error);
    } finally {
      setSubmittingRating(false);
    }
  };

  // High-contrast light-themed map style
  const lightMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#F1F5F9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#0F172A' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#CBD5E1' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#CBD5E1' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#E2E8F0' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#93C5FD' }] },
  ];

  const renderAgencyItem = ({ item }: { item: Agency }) => (
    <View style={styles.agencyCard}>
      <View style={styles.cardInfo}>
        <Text style={styles.agencyName}>{item.name}</Text>
        <Text style={styles.agencyAddress}>{item.address}</Text>
        <Text style={styles.agencyPhone}>📞 {item.phone}</Text>
        
        <View style={styles.ratingBadgeContainer}>
          <View style={styles.starContainer}>
            <Icon name="star" size={16} color="#EAB308" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
          {item.distance !== undefined && (
            <Text style={styles.distanceText}>
              • {item.distance.toFixed(1)} km away
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity style={styles.rateBtn} onPress={() => handleOpenRatingModal(item)}>
        <Icon name="star-outline" size={18} color={theme.colors.primary} />
        <Text style={styles.rateBtnText}>Review</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Map View Section (Default to SF coordinates if GPS fails) */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          customMapStyle={lightMapStyle}
          initialRegion={{
            latitude: userLocation?.latitude ?? 37.7749,
            longitude: userLocation?.longitude ?? -122.4194,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {/* User Location Marker */}
          {userLocation && (
            <Marker
              coordinate={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              title="You Are Here"
            >
              <View style={styles.userMarkerCircle}>
                <Icon name="account" size={16} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {/* Agency Markers */}
          {agencies.map(agency => (
            <Marker
              key={agency.id}
              coordinate={{
                latitude: agency.latitude,
                longitude: agency.longitude,
              }}
              title={agency.name}
              description={agency.address}
            >
              <View style={styles.customMarker}>
                <View style={styles.markerCircle}>
                  <Icon name="wrench" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.markerArrow} />
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* List View Section */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Authorized Service Centers</Text>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <FlatList
            data={agencies}
            keyExtractor={item => item.id}
            renderItem={renderAgencyItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No agencies found nearby.</Text>
            }
          />
        )}
      </View>

      {/* RATE AGENCY MODAL */}
      <Modal visible={ratingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Service Center</Text>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                <Icon name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.ratingForm}>
              <Text style={styles.agencyTitle}>{selectedAgency?.name}</Text>
              
              {/* Star selector */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map(num => (
                  <TouchableOpacity key={num} onPress={() => setScore(num)}>
                    <Icon
                      name={num <= score ? 'star' : 'star-outline'}
                      size={42}
                      color="#EAB308"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Write your review</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Share your experience (oil quality, speed, service)..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
              />

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitRating}>
                {submittingRating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
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
  mapContainer: {
    height: '40%',
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  listSection: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
    paddingTop: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  loader: {
    marginTop: 40,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  agencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    marginBottom: 12,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 8,
  },
  agencyName: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: theme.typography.weights.bold,
  },
  agencyAddress: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: theme.typography.weights.medium,
  },
  agencyPhone: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: theme.typography.weights.medium,
  },
  ratingBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.highlight,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  ratingText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    marginLeft: 4,
  },
  distanceText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    fontWeight: theme.typography.weights.medium,
  },
  rateBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.highlight,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  rateBtnText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    marginTop: 4,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    fontWeight: theme.typography.weights.medium,
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
  ratingForm: {
    padding: 20,
  },
  agencyTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
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
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderLeftColor: 'transparent',
    borderRightWidth: 6,
    borderRightColor: 'transparent',
    borderTopWidth: 6,
    borderTopColor: theme.colors.primary,
    alignSelf: 'center',
    marginTop: -1,
  },
  userMarkerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3D7BF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
