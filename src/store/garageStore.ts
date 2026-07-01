/**
 * garageStore.ts — Zustand
 *
 * Manages the user's multi-vehicle garage.
 * Local SQLite is the source of truth; API syncs are additive.
 */

import { create } from 'zustand';
import {
  getAllVehicles,
  upsertVehicle,
  deleteVehicle,
  type Vehicle,
} from '../db/clientDatabase';
import { claimVehicle, type ClaimVehicleResponse } from '../services/apiClient';

interface GarageState {
  vehicles: Vehicle[];
  isLoading: boolean;
  error: string | null;
  fetchGarage: (userId: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'claimed_at' | 'owner_user_id'>, userId: string) => Promise<void>;
  claimFromDeepLink: (vehicleId: string, userId: string) => Promise<ClaimVehicleResponse>;
  removeVehicle: (vehicleId: string) => Promise<void>;
  clearError: () => void;
}

export const useGarageStore = create<GarageState>((set, get) => ({
  vehicles: [],
  isLoading: false,
  error: null,

  fetchGarage: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const vehicles = await getAllVehicles(userId);
      set({ vehicles });
    } catch (e: any) {
      set({ error: 'Failed to load your garage.' });
    } finally {
      set({ isLoading: false });
    }
  },

  addVehicle: async (partial, userId) => {
    const vehicle: Vehicle = {
      ...partial,
      claimed_at: new Date().toISOString(),
      owner_user_id: userId,
    };
    await upsertVehicle(vehicle);
    set(state => ({ vehicles: [vehicle, ...state.vehicles] }));
  },

  claimFromDeepLink: async (vehicleId: string, userId: string): Promise<ClaimVehicleResponse> => {
    set({ isLoading: true, error: null });
    try {
      const response = await claimVehicle(vehicleId, userId);
      const vehicle: Vehicle = {
        ...response.vehicle,
        owner_user_id: userId,
        claimed_at: new Date().toISOString(),
      };
      await upsertVehicle(vehicle);
      set(state => {
        const existing = state.vehicles.findIndex(v => v.id === vehicleId);
        const updated = [...state.vehicles];
        if (existing >= 0) updated[existing] = vehicle;
        else updated.unshift(vehicle);
        return { vehicles: updated };
      });
      return response;
    } catch (e: any) {
      set({ error: e.message ?? 'Failed to claim vehicle.' });
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  removeVehicle: async (vehicleId: string) => {
    await deleteVehicle(vehicleId);
    set(state => ({ vehicles: state.vehicles.filter(v => v.id !== vehicleId) }));
  },

  clearError: () => set({ error: null }),
}));
