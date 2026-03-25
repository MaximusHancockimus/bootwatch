/**
 * Feature flags (Expo inlines `EXPO_PUBLIC_*` at bundle time).
 *
 * Timer mascot:
 * - Unset → ON in local dev (`__DEV__`), OFF in release/store builds.
 * - `EXPO_PUBLIC_SHOW_MASCOT=1` or `true` → always ON.
 * - `EXPO_PUBLIC_SHOW_MASCOT=0` or `false` → always OFF (even in dev).
 */

function parseMascotFlag(): boolean | null {
  const raw = process.env.EXPO_PUBLIC_SHOW_MASCOT?.trim().toLowerCase();
  if (!raw) return null;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return null;
}

const mascotOverride = parseMascotFlag();

/** Raccoon “on watch” art on the active timer screen */
export const showTimerMascot =
  mascotOverride !== null
    ? mascotOverride
    : typeof __DEV__ !== 'undefined' && __DEV__;
