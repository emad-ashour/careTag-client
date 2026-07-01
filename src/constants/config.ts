/**
 * CareTag Consumer App — Global Configuration
 *
 * All environment-specific values live here. When the real backend
 * is ready, replace MOCK_API with false and set API_BASE_URL.
 */

// ─── API ─────────────────────────────────────────────────────────────────────
export const API_BASE_URL = 'https://api.caretag.io/v1'; // TODO: replace with real URL
export const USE_MOCK_API = true; // Flip to false when backend is live

// ─── Deep Link Scheme ────────────────────────────────────────────────────────
/** Shared with the B2B mechanic app. Consumer claim uses /claim/ path. */
export const DEEP_LINK_SCHEME = 'caryapp';
export const DEEP_LINK_CLAIM_PREFIX = `${DEEP_LINK_SCHEME}://claim/`;
export const DEEP_LINK_VEHICLE_PREFIX = `${DEEP_LINK_SCHEME}://vehicle/`;

// ─── OAuth (replace with real credentials before publishing) ────────────────
export const GOOGLE_WEB_CLIENT_ID = 'TODO_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com';
export const FACEBOOK_APP_ID = 'TODO_FACEBOOK_APP_ID';
export const MICROSOFT_CLIENT_ID = 'TODO_MICROSOFT_CLIENT_ID';
export const MICROSOFT_AUTHORITY = 'https://login.microsoftonline.com/common';

// ─── Feature Constants ───────────────────────────────────────────────────────
/** Max visible service history entries for a transferred (new-owner) vehicle */
export const TRUNCATED_HISTORY_LIMIT = 5;

/** Months before due date to fire the early reminder notification */
export const EARLY_REMINDER_MONTHS = 1;

/** Radius (km) to search for nearby agencies */
export const AGENCY_SEARCH_RADIUS_KM = 25;

// ─── Notification Channels ───────────────────────────────────────────────────
export const NOTIF_CHANNEL_MAINTENANCE = 'caretag_maintenance';
export const NOTIF_CHANNEL_GENERAL = 'caretag_general';

// ─── SQLite ──────────────────────────────────────────────────────────────────
export const DB_NAME = 'caretag_client.db';
