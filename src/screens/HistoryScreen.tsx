/**
 * HistoryScreen.tsx
 *
 * Displays a chronological timeline of service visits for a selected vehicle.
 * Reads from SQLite and falls back to API fetching (caching to DB) on first load.
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useGarageStore } from '../store/garageStore';
import { getServiceHistory, insertServiceHistoryBatch, type ServiceHistory } from '../db/clientDatabase';
import { fetchServiceHistoryAPI } from '../services/apiClient';
import { theme } from '../theme';

export default function HistoryScreen({ route }: any) {
  const { vehicles } = useGarageStore();
  const routeVehicleId = route?.params?.vehicleId;

  const [selectedVehId, setSelectedVehId] = useState<string | null>(null);
  const [history, setHistory] = useState<ServiceHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // Set default selected vehicle from route params, or fallback to first vehicle in garage
  useEffect(() => {
    if (routeVehicleId) {
      setSelectedVehId(routeVehicleId);
    } else if (vehicles.length > 0 && !selectedVehId) {
      setSelectedVehId(vehicles[0].id);
    }
  }, [routeVehicleId, vehicles]);

  // Load history from DB, fallback to API if empty
  useEffect(() => {
    if (selectedVehId) {
      loadHistory(selectedVehId);
    }
  }, [selectedVehId]);

  const loadHistory = async (vehId: string) => {
    setLoading(true);
    try {
      let localHistory = await getServiceHistory(vehId);
      
      // If no local history is present, fetch from API and cache to DB
      if (localHistory.length === 0) {
        const apiVisits = await fetchServiceHistoryAPI(vehId);
        // Map API model to DB model
        const dbVisits: ServiceHistory[] = apiVisits.map(v => ({
          id: v.id,
          vehicle_id: v.vehicle_id,
          service_type: v.service_type,
          oil_type: v.oil_type,
          filter_changed: v.filter_changed,
          mileage: v.mileage,
          completed_at: v.completed_at,
          technician_name: v.technician_name,
          notes: v.notes,
        }));
        
        await insertServiceHistoryBatch(dbVisits);
        localHistory = await getServiceHistory(vehId);
      }
      
      setHistory(localHistory);
    } catch (e) {
      console.error('[HistoryScreen] Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehId);

  const renderTimelineItem = ({ item, index }: { item: ServiceHistory; index: number }) => (
    <View style={styles.timelineRow}>
      {/* Left Timeline Indicator */}
      <View style={styles.timelineIndicator}>
        <View style={styles.timelineCircle}>
          <Icon name="wrench" size={14} color={theme.colors.primary} />
        </View>
        {index < history.length - 1 && <View style={styles.timelineLine} />}
      </View>

      {/* Right Service Details Card */}
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.serviceType}>{item.service_type}</Text>
          <Text style={styles.dateText}>
            {new Date(item.completed_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.specsRow}>
          <View style={styles.specBadge}>
            <Icon name="speedometer" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.specVal}>{item.mileage.toLocaleString()} km</Text>
          </View>
          <View style={styles.specBadge}>
            <Icon name="oil" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.specVal}>{item.oil_type}</Text>
          </View>
          <View style={[styles.specBadge, { 
            backgroundColor: item.filter_changed ? theme.colors.highlight : theme.colors.dangerBg,
            borderColor: item.filter_changed ? theme.colors.primary : theme.colors.danger
          }]}>
            <Icon name="filter" size={14} color={item.filter_changed ? theme.colors.primary : theme.colors.danger} />
            <Text style={[styles.specVal, { color: item.filter_changed ? theme.colors.primary : theme.colors.danger }]}>
              {item.filter_changed ? 'Filter Replaced' : 'Filter Inspected'}
            </Text>
          </View>
        </View>

        {/* Display PII details (technician and notes) only if they are not severed/omitted */}
        {item.technician_name && (
          <View style={styles.piiSection}>
            <Text style={styles.piiLabel}>Technician: <Text style={styles.piiVal}>{item.technician_name}</Text></Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Service Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Vehicle Horizontal Selector */}
      <View style={styles.selectorContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={vehicles}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.selectorTab,
                item.id === selectedVehId && styles.selectorTabActive,
              ]}
              onPress={() => setSelectedVehId(item.id)}
            >
              <Text
                style={[
                  styles.selectorText,
                  item.id === selectedVehId && styles.selectorTextActive,
                ]}
              >
                {item.make} {item.model}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.selectorList}
          ListEmptyComponent={
            <Text style={styles.noVehiclesSelectorText}>No vehicles in garage</Text>
          }
        />
      </View>

      {/* Timeline List */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.id}
          renderItem={renderTimelineItem}
          contentContainerStyle={styles.timelineContainer}
          ListHeaderComponent={
            selectedVehicle?.is_transferred === 1 ? (
              <View style={styles.truncatedNotice}>
                <Icon name="information-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.noticeText}>
                  Showing truncated mechanical history (last 5 visits). Personal data severed.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            selectedVehId ? (
              <View style={styles.emptyContainer}>
                <Icon name="history" size={56} color={theme.colors.textSecondary} />
                <Text style={styles.emptyText}>No service visits logged yet.</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="car" size={56} color={theme.colors.textSecondary} />
                <Text style={styles.emptyText}>Add a vehicle to view its history.</Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  selectorContainer: {
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1.5,
  },
  selectorList: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  selectorTab: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.button,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  selectorTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectorText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
  },
  selectorTextActive: {
    color: '#FFFFFF',
  },
  noVehiclesSelectorText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: theme.typography.weights.medium,
  },
  loader: {
    marginTop: 40,
  },
  timelineContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 32,
  },
  timelineCircle: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    backgroundColor: theme.colors.border,
    flex: 1,
    position: 'absolute',
    top: 24,
    bottom: -16,
  },
  historyCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.card,
    padding: 16,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    marginLeft: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceType: {
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  specBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 8,
    marginTop: 6,
  },
  specVal: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    marginLeft: 4,
  },
  piiSection: {
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.border,
    paddingTop: 8,
    marginBottom: 6,
  },
  piiLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: theme.typography.weights.medium,
  },
  piiVal: {
    color: theme.colors.textPrimary,
    fontWeight: theme.typography.weights.bold,
  },
  notesSection: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notesTitle: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: theme.typography.weights.bold,
    marginBottom: 4,
  },
  notesText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: theme.typography.weights.medium,
  },
  truncatedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.highlight,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: theme.typography.weights.bold,
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    marginTop: 12,
    fontWeight: theme.typography.weights.bold,
  },
});
