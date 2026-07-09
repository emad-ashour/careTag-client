/**
 * clientDatabase.ts
 *
 * Local SQLite database configuration and helpers.
 */

import SQLite from 'react-native-sqlite-storage';
import { DB_NAME, TRUNCATED_HISTORY_LIMIT } from '../constants/config';

SQLite.enablePromise(true);

export interface Vehicle {
  id: string;
  owner_user_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  vin: string;
  mileage: number;
  last_service_date: string;
  is_transferred: number; // 0 = original, 1 = transferred to current user
  claimed_at: string;
}

export interface ServiceHistory {
  id: string;
  vehicle_id: string;
  service_type: string;
  oil_type: string;
  filter_changed: number; // 0 or 1
  mileage: number;
  completed_at: string;
  technician_name?: string; // May be null/severed on transfer
  notes?: string;           // May be null/severed on transfer
}

export interface MaintenanceReminder {
  id: string;
  vehicle_id: string;
  title: string;
  due_date: string;
  notif_id: string; // comma-concatenated notification trigger IDs
  status: 'pending' | 'completed' | 'dismissed';
}

export interface AgencyRating {
  id: string;
  agency_id: string;
  rating: number;
  comment: string;
  synced: number; // 0 or 1
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getClientDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;

  dbInstance = await SQLite.openDatabase({
    name: DB_NAME,
    location: 'default',
  });

  await _createTables(dbInstance);
  return dbInstance;
};

const _createTables = async (db: SQLite.SQLiteDatabase) => {
  await db.transaction(tx => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        license_plate TEXT NOT NULL,
        vin TEXT NOT NULL,
        mileage INTEGER NOT NULL,
        last_service_date TEXT NOT NULL,
        is_transferred INTEGER DEFAULT 0,
        claimed_at TEXT NOT NULL
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS service_history (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        oil_type TEXT NOT NULL,
        filter_changed INTEGER NOT NULL,
        mileage INTEGER NOT NULL,
        completed_at TEXT NOT NULL,
        technician_name TEXT,
        notes TEXT,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS maintenance_reminders (
        id TEXT PRIMARY KEY,
        vehicle_id TEXT NOT NULL,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL,
        notif_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
      );
    `);

    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS agency_ratings (
        id TEXT PRIMARY KEY,
        agency_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      );
    `);
  });
};

// ─── Vehicles Helpers ─────────────────────────────────────────────────────────

export const getAllVehicles = async (userId: string): Promise<Vehicle[]> => {
  const db = await getClientDB();
  const [results] = await db.executeSql(
    'SELECT * FROM vehicles WHERE owner_user_id = ? ORDER BY claimed_at DESC',
    [userId],
  );
  const list: Vehicle[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    list.push(results.rows.item(i));
  }
  return list;
};

export const upsertVehicle = async (vehicle: Vehicle): Promise<void> => {
  const db = await getClientDB();
  await db.executeSql(
    `INSERT OR REPLACE INTO vehicles (
      id, owner_user_id, make, model, year, license_plate, vin, mileage, last_service_date, is_transferred, claimed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vehicle.id,
      vehicle.owner_user_id,
      vehicle.make,
      vehicle.model,
      vehicle.year,
      vehicle.license_plate,
      vehicle.vin,
      vehicle.mileage,
      vehicle.last_service_date,
      vehicle.is_transferred,
      vehicle.claimed_at,
    ],
  );
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  const db = await getClientDB();
  await db.transaction(tx => {
    tx.executeSql('DELETE FROM vehicles WHERE id = ?', [vehicleId]);
    tx.executeSql('DELETE FROM service_history WHERE vehicle_id = ?', [vehicleId]);
    tx.executeSql('DELETE FROM maintenance_reminders WHERE vehicle_id = ?', [vehicleId]);
  });
};

// ─── Service History Helpers ──────────────────────────────────────────────────

export const getServiceHistory = async (vehicleId: string): Promise<ServiceHistory[]> => {
  const db = await getClientDB();
  
  // Check if vehicle was transferred
  const [vResult] = await db.executeSql('SELECT is_transferred FROM vehicles WHERE id = ?', [vehicleId]);
  const isTransferred = vResult.rows.length > 0 && vResult.rows.item(0).is_transferred === 1;

  if (isTransferred) {
    // Transferred vehicle: Sever PII (technician & notes) and limit to TRUNCATED_HISTORY_LIMIT (last 5)
    const [results] = await db.executeSql(
      `SELECT id, vehicle_id, service_type, oil_type, filter_changed, mileage, completed_at 
       FROM service_history 
       WHERE vehicle_id = ? 
       ORDER BY completed_at DESC 
       LIMIT ?`,
      [vehicleId, TRUNCATED_HISTORY_LIMIT],
    );
    const list: ServiceHistory[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      list.push({
        ...item,
        technician_name: undefined,
        notes: undefined,
      });
    }
    return list;
  } else {
    // Normal vehicle: show full history including PII
    const [results] = await db.executeSql(
      'SELECT * FROM service_history WHERE vehicle_id = ? ORDER BY completed_at DESC',
      [vehicleId],
    );
    const list: ServiceHistory[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      list.push(results.rows.item(i));
    }
    return list;
  }
};

export const insertServiceHistoryBatch = async (visits: ServiceHistory[]): Promise<void> => {
  const db = await getClientDB();
  await db.transaction(tx => {
    visits.forEach(visit => {
      tx.executeSql(
        `INSERT OR REPLACE INTO service_history (
          id, vehicle_id, service_type, oil_type, filter_changed, mileage, completed_at, technician_name, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          visit.id,
          visit.vehicle_id,
          visit.service_type,
          visit.oil_type,
          visit.filter_changed,
          visit.mileage,
          visit.completed_at,
          visit.technician_name ?? null,
          visit.notes ?? null,
        ],
      );
    });
  });
};

// ─── Maintenance Reminders Helpers ────────────────────────────────────────────

export const getMaintenanceReminders = async (vehicleId: string): Promise<MaintenanceReminder[]> => {
  const db = await getClientDB();
  const [results] = await db.executeSql(
    'SELECT * FROM maintenance_reminders WHERE vehicle_id = ? ORDER BY due_date ASC',
    [vehicleId],
  );
  const list: MaintenanceReminder[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    list.push(results.rows.item(i));
  }
  return list;
};

export const upsertMaintenanceReminder = async (reminder: MaintenanceReminder): Promise<void> => {
  const db = await getClientDB();
  await db.executeSql(
    'INSERT OR REPLACE INTO maintenance_reminders (id, vehicle_id, title, due_date, notif_id, status) VALUES (?, ?, ?, ?, ?, ?)',
    [reminder.id, reminder.vehicle_id, reminder.title, reminder.due_date, reminder.notif_id, reminder.status],
  );
};

export const deleteMaintenanceReminder = async (reminderId: string): Promise<void> => {
  const db = await getClientDB();
  await db.executeSql('DELETE FROM maintenance_reminders WHERE id = ?', [reminderId]);
};

// ─── Agency Ratings Helpers (Offline First) ──────────────────────────────────

export const insertOfflineRating = async (rating: Omit<AgencyRating, 'synced'>): Promise<void> => {
  const db = await getClientDB();
  await db.executeSql(
    'INSERT OR REPLACE INTO agency_ratings (id, agency_id, rating, comment, synced) VALUES (?, ?, ?, ?, 0)',
    [rating.id, rating.agency_id, rating.rating, rating.comment],
  );
};

export const getUnsyncedRatings = async (): Promise<AgencyRating[]> => {
  const db = await getClientDB();
  const [results] = await db.executeSql('SELECT * FROM agency_ratings WHERE synced = 0');
  const list: AgencyRating[] = [];
  for (let i = 0; i < results.rows.length; i++) {
    list.push(results.rows.item(i));
  }
  return list;
};

export const markRatingSynced = async (ratingId: string): Promise<void> => {
  const db = await getClientDB();
  await db.executeSql('UPDATE agency_ratings SET synced = 1 WHERE id = ?', [ratingId]);
};
