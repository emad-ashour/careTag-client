# CareTag API & Backend Master Contract

## 1. Core Philosophy
This application relies on a centralized Supabase PostgreSQL backend. All agents must strictly adhere to these routing rules to ensure the mobile application can communicate with the local development database across all emulator and physical device environments.

## 2. Environment Variable Routing (CRITICAL)
Do not hardcode `localhost` into API calls. The AI agent must configure the Supabase client to dynamically resolve the local backend URL based on the execution environment.

* **For iOS Simulators:** Route local requests to `http://127.0.0.1:54321`
* **For Android Emulators:** Route local requests to `http://10.0.2.2:54321`
* **For Physical Devices:** The agent must configure the `.env.local` file to accept a dynamic network IP (e.g., `http://192.168.X.X:54321`) provided by the human developer.

## 3. Data Fetching Standards
* **Supabase Client:** Strictly use the `@supabase/supabase-js` library for all backend interactions.
* **RLS Awareness:** All queries must pass the authenticated user's JWT. Do not attempt to bypass Row Level Security.
* **Offline-First Resilience:** If the local backend is unreachable (e.g., the developer forgot to run `supabase start`), the agent MUST wrap the fetch call in a `try/catch` block. It should elegantly fall back to the local SQLite database or display a "Sync Pending / Offline Mode" UI rather than crashing the app.

## 4. Local Execution Context
Agents should assume the human developer has already run `supabase start` in a separate terminal window. The agent's job is strictly to map the frontend API calls to those exposed local ports using the routing rules in Section 2.