/**
 * Public surface of the settings feature.
 *
 * Client-safe: UI and "use server" actions (safe to import anywhere).
 */
export { SettingsView } from "./components/settings-view";
export { updateProfile, type SettingsResult } from "./actions";
export { updateProfileSchema, type UpdateProfileInput } from "./schemas";
