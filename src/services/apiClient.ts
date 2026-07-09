/**
 * apiClient.ts
 *
 * REST API client with built-in Dev Mock Interceptors.
 */

import axios from 'axios';
import { API_BASE_URL, USE_MOCK_API } from '../constants/config';
import type { Vehicle } from '../db/clientDatabase';

export interface ClaimVehicleResponse {
  success: boolean;
  vehicle: Vehicle;
}

export interface Agency {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  phone: string;
  distance?: number;
}

export interface ServiceVisit {
  id: string;
  vehicle_id: string;
  service_type: string;
  oil_type: string;
  filter_changed: number; // 0 or 1
  mileage: number;
  completed_at: string;
  technician_name?: string; // To be severed on transfer
  notes?: string;           // To be severed on transfer
}

// Instantiate Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const claimVehicle = async (vehicleId: string, userId: string): Promise<ClaimVehicleResponse> => {
  if (USE_MOCK_API) {
    await _delay(800);
    const mockVehicle: Vehicle = {
      id: vehicleId,
      owner_user_id: userId,
      make: 'Tesla',
      model: 'Model 3',
      year: 2022,
      license_plate: 'CT-382-X',
      vin: '5YJ3F1EA2NF1MOCK9',
      mileage: 18450,
      last_service_date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      is_transferred: 0,
      claimed_at: new Date().toISOString(),
    };
    return { success: true, vehicle: mockVehicle };
  }

  const res = await api.post<ClaimVehicleResponse>('/vehicles/claim', { vehicleId, userId });
  return res.data;
};

export const initiateTransfer = async (vehicleId: string, contact: string): Promise<{ success: boolean }> => {
  if (USE_MOCK_API) {
    await _delay(600);
    return { success: true };
  }
  const res = await api.post('/vehicles/transfer', { vehicleId, contact });
  return res.data;
};

export const fetchAgencies = async (): Promise<Agency[]> => {
  if (USE_MOCK_API) {
    await _delay(500);
    return [
      {
        id: 'ag-1',
        name: 'CareTag Pro Auto - Downtown',
        address: '742 Evergreens Terrace, Springfield',
        latitude: 37.7749, // Center around SF for mock maps compatibility
        longitude: -122.4194,
        rating: 4.8,
        phone: '+1 (555) 019-2834',
      },
      {
        id: 'ag-2',
        name: 'Precision CareTag Garage',
        address: '1012 Industrial Parkway, Springfield',
        latitude: 37.7833,
        longitude: -122.4167,
        rating: 4.6,
        phone: '+1 (555) 014-9988',
      },
      {
        id: 'ag-3',
        name: 'Apex CareTag Autoworks',
        address: '505 Ocean Blvd, Springfield',
        latitude: 37.7699,
        longitude: -122.4468,
        rating: 4.9,
        phone: '+1 (555) 012-7362',
      },
    ];
  }
  const res = await api.get<Agency[]>('/agencies');
  return res.data;
};

export const fetchServiceHistoryAPI = async (vehicleId: string): Promise<ServiceVisit[]> => {
  if (USE_MOCK_API) {
    await _delay(400);
    return [
      {
        id: 'visit-1',
        vehicle_id: vehicleId,
        service_type: 'Full Maintenance & Inspection',
        oil_type: '5W-30 Full Synthetic',
        filter_changed: 1,
        mileage: 15200,
        completed_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
        technician_name: 'David Miller',
        notes: 'Replaced oil filter, checked brake pad wear, tires rotated.',
      },
      {
        id: 'visit-2',
        vehicle_id: vehicleId,
        service_type: 'Minor Maintenance',
        oil_type: '5W-30 Synthetic Blend',
        filter_changed: 0,
        mileage: 10100,
        completed_at: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
        technician_name: 'Sarah Connor',
        notes: 'Top-up wiper fluid, air filter inspected, oil changed.',
      },
      {
        id: 'visit-3',
        vehicle_id: vehicleId,
        service_type: 'Brake Service',
        oil_type: 'N/A',
        filter_changed: 0,
        mileage: 8400,
        completed_at: new Date(Date.now() - 200 * 24 * 3600 * 1000).toISOString(),
        technician_name: 'Marcus Wright',
        notes: 'Front brake pads replaced. Rotors machined.',
      },
      {
        id: 'visit-4',
        vehicle_id: vehicleId,
        service_type: 'Battery Replacement',
        oil_type: 'N/A',
        filter_changed: 0,
        mileage: 5100,
        completed_at: new Date(Date.now() - 320 * 24 * 3600 * 1000).toISOString(),
        technician_name: 'Sarah Connor',
        notes: '12V battery replaced under warranty.',
      },
      {
        id: 'visit-5',
        vehicle_id: vehicleId,
        service_type: 'Initial Inspection',
        oil_type: '0W-20 Factory Fill',
        filter_changed: 1,
        mileage: 1200,
        completed_at: new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString(),
        technician_name: 'David Miller',
        notes: 'Complementary 1000-mile inspection. All clear.',
      },
      {
        id: 'visit-6',
        vehicle_id: vehicleId,
        service_type: 'Pre-delivery Service',
        oil_type: 'N/A',
        filter_changed: 0,
        mileage: 15,
        completed_at: new Date(Date.now() - 450 * 24 * 3600 * 1000).toISOString(),
        technician_name: 'Marcus Wright',
        notes: 'PDI completed, clean delivery.',
      },
    ];
  }
  const res = await api.get<ServiceVisit[]>(`/vehicles/${vehicleId}/history`);
  return res.data;
};

export const submitRating = async (
  agencyId: string,
  rating: number,
  comment: string,
): Promise<{ success: boolean }> => {
  if (USE_MOCK_API) {
    await _delay(400);
    return { success: true };
  }
  const res = await api.post('/ratings', { agencyId, rating, comment });
  return res.data;
};

const _delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
