import { track } from '@nf/analytics';
import { i18next } from '@nf/i18n';
import { Asset } from 'expo-asset';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Alert, Linking } from 'react-native';

import { useFrameChoice } from './booth';
import { findFrame, useCatalog } from './catalog';
import { PICKS, resetSession, storeShot, useSession } from './session';

/** EXPO_PUBLIC_MOCK_CAMERA=1: bundled sample shots instead of the camera (simulators, E2E). */
export const MOCK_CAMERA = process.env.EXPO_PUBLIC_MOCK_CAMERA === '1';

const MOCK_SHOTS = [
  require('../assets/mock/shot-1.png'),
  require('../assets/mock/shot-2.png'),
  require('../assets/mock/shot-3.png'),
  require('../assets/mock/shot-4.png'),
  require('../assets/mock/shot-5.png'),
  require('../assets/mock/shot-6.png'),
  require('../assets/mock/shot-7.png'),
  require('../assets/mock/shot-8.png'),
] as const;

/** Stores sample shot `index` as if it had just been captured. */
export async function storeMockShot(index: number) {
  const asset = await Asset.fromModule(MOCK_SHOTS[index % MOCK_SHOTS.length]).downloadAsync();
  await storeShot(index, asset.localUri ?? asset.uri, asset.width ?? 1200, asset.height ?? 800);
}

function trackStart(source: 'camera' | 'album') {
  const frameId = useFrameChoice.getState().frameId;
  const frame = findFrame(useCatalog.getState().packs, frameId);
  track('booth_start', { frame_id: frameId, pack_id: frame?.pack.id ?? 'base', source });
}

/**
 * "Let's shoot": camera permission on first use (never during onboarding, PLAN 예외 › 권한 거부).
 * Denied → explain and offer Settings; the album path stays available.
 */
export async function startShooting() {
  if (!MOCK_CAMERA) {
    let permission = await Camera.getCameraPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) permission = await Camera.requestCameraPermissionsAsync();
    if (!permission.granted) {
      track('permission_denied', { type: 'camera' });
      Alert.alert(i18next.t('permission.cameraTitle'), i18next.t('permission.cameraBody'), [
        { text: i18next.t('action.cancel'), style: 'cancel' },
        { text: i18next.t('action.openSettings'), onPress: () => void Linking.openSettings() },
      ]);
      return;
    }
  }
  resetSession('camera');
  trackStart('camera');
  router.push('/booth/b5-capture');
}

/** "From album": PHPicker, exactly 4 photos, centre-cropped later into the slots → B7 (PLAN 앨범 가져오기). */
export async function startFromAlbum(): Promise<boolean> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: PICKS,
    orderedSelection: true,
    quality: 1,
  });
  if (result.canceled) return false;
  if (result.assets.length < PICKS) {
    Alert.alert(i18next.t('pick.title', { count: PICKS }));
    return false;
  }
  resetSession('album');
  await Promise.all(result.assets.slice(0, PICKS).map((a, i) => storeShot(i, a.uri, a.width, a.height)));
  useSession.setState({ picked: [0, 1, 2, 3] });
  trackStart('album');
  router.push('/booth/b7-decorate');
  return true;
}
