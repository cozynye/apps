import { recordError } from '@nf/analytics';
import { mmkvStateStorage } from '@nf/ui';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const PASSCODE_KEY = 'lock.passcode.v1';
export const PASSCODE_LENGTH = 4;

/** Persisted switch (MMKV settings: 잠금). The passcode itself is only a salted hash in SecureStore. */
export const useLockSettings = create<{ enabled: boolean; setEnabled: (enabled: boolean) => void }>()(
  persist((set) => ({ enabled: false, setEnabled: (enabled) => set({ enabled }) }), {
    name: 'lock.v1',
    storage: createJSONStorage(() => mmkvStateStorage),
    version: 1,
  }),
);

/**
 * Runtime state: `locked` shows A11; `covered` hides content while the app is inactive or in the
 * background (app switcher snapshot). Starts locked when the lock is on.
 */
export const useLockState = create<{ locked: boolean; covered: boolean }>(() => ({
  locked: useLockSettings.getState().enabled,
  covered: false,
}));

export function unlock() {
  useLockState.setState({ locked: false });
}

async function hash(salt: string, code: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${code}`);
}

export async function setPasscode(code: string): Promise<void> {
  const salt = Crypto.randomUUID();
  await SecureStore.setItemAsync(PASSCODE_KEY, `${salt}:${await hash(salt, code)}`, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function verifyPasscode(code: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PASSCODE_KEY);
  if (!stored) return false;
  const [salt, digest] = stored.split(':');
  return !!salt && digest === (await hash(salt, code));
}

export async function clearPasscode(): Promise<void> {
  await SecureStore.deleteItemAsync(PASSCODE_KEY);
}

export type BiometricMethod = 'Face ID' | 'Touch ID';

/** The enrolled biometric, if any. Names are Apple's product names, identical in every language. */
export async function availableBiometric(): Promise<BiometricMethod | null> {
  try {
    if (!(await LocalAuthentication.hasHardwareAsync()) || !(await LocalAuthentication.isEnrolledAsync())) return null;
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Touch ID';
  } catch (error) {
    recordError(error as Error, 'availableBiometric');
  }
  return null;
}

/** Biometric prompt without the device-passcode fallback; the app's own passcode is the fallback. */
export async function authenticateWithBiometric(prompt: string, cancelLabel: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel,
    disableDeviceFallback: true,
  });
  return result.success;
}

/** Locks when the app goes to the background and covers content while inactive (PLAN 규칙 › 잠금). */
export function useAppLockLifecycle() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (!useLockSettings.getState().enabled) return useLockState.setState({ covered: false });
      if (state === 'background') useLockState.setState({ locked: true, covered: true });
      else if (state === 'inactive') useLockState.setState({ covered: true });
      else useLockState.setState({ covered: false });
    });
    return () => sub.remove();
  }, []);
}
