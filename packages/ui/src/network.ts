import { useNetworkState } from 'expo-network';

/** Offline only when the OS says so; unknown (undefined) counts as online. */
export function useIsOffline(): boolean {
  const state = useNetworkState();
  return state.isConnected === false || state.isInternetReachable === false;
}
