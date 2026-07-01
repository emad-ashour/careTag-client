/**
 * transferService.ts
 *
 * Secure Ownership Transfer workflow.
 *
 * DATA SURGERY CONTRACT (enforced by backend):
 *   ✅ Inherited by new owner:  service_type, oil_type, filter_changed, mileage, completed_at
 *   ❌ Permanently severed:     owner identity, technician name, agency personal notes
 *   ❌ Hidden (truncated):      all but last TRUNCATED_HISTORY_LIMIT visible entries
 */

import { initiateTransfer as apiInitiateTransfer } from './apiClient';
import { deleteVehicle } from '../db/clientDatabase';

export type TransferStatus =
  | 'idle'
  | 'confirming'
  | 'sending'
  | 'sms_sent'
  | 'complete'
  | 'error';

export interface TransferResult {
  success: boolean;
  message: string;
}

export const performOwnershipTransfer = async (
  vehicleId: string,
  newOwnerContact: string,
): Promise<TransferResult> => {
  try {
    await apiInitiateTransfer(vehicleId, newOwnerContact);
    await deleteVehicle(vehicleId);
    return {
      success: true,
      message: 'Vehicle transferred successfully. The new owner has been notified via SMS.',
    };
  } catch (error: any) {
    console.error('[transferService] Transfer failed:', error);
    return {
      success: false,
      message: error?.response?.data?.message ?? 'Transfer failed. Please try again.',
    };
  }
};
