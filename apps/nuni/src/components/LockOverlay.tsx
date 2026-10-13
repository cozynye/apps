import { Button, Mascot, space, Text, useTheme } from '@nf/ui';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import {
  authenticateWithBiometric,
  availableBiometric,
  PASSCODE_LENGTH,
  unlock,
  useLockState,
  verifyPasscode,
  type BiometricMethod,
} from '../lock';
import { PasscodePad } from './PasscodePad';

/**
 * A11 lock screen and the background cover. Drawn in a FullWindowOverlay so it also hides open
 * sheets and modals (DECISIONS: a root overlay rather than the `a11-lock` route).
 */
export function LockOverlay() {
  const locked = useLockState((s) => s.locked);
  const covered = useLockState((s) => s.covered);
  if (!locked && !covered) return null;
  return <FullWindowOverlay>{locked ? <LockScreen /> : <Cover />}</FullWindowOverlay>;
}

function Cover() {
  const { colors } = useTheme();
  return (
    <View style={[styles.fill, styles.center, { backgroundColor: colors.surface1 }]} testID="a11.cover">
      <Mascot mood={3} size={96} />
    </View>
  );
}

function LockScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);
  const [method, setMethod] = useState<BiometricMethod | null>(null);

  const tryBiometric = useCallback(
    async (m: BiometricMethod) => {
      if (await authenticateWithBiometric(t('lock.biometric', { method: m }), t('lock.passcode'))) unlock();
    },
    [t],
  );

  // Face ID / Touch ID once per lock (this screen mounts each time the app locks), as soon as the
  // app is active; after a failure or cancel the passcode pad stays (PLAN 예외 › 앱 잠금 실패).
  // Retrying on every return to "active" re-opened the prompt in a loop, since the prompt itself
  // makes the app inactive.
  const attempted = useRef(false);
  useEffect(() => {
    function attempt() {
      if (attempted.current) return;
      attempted.current = true;
      void availableBiometric().then((m) => {
        setMethod(m);
        if (m) void tryBiometric(m);
      });
    }
    if (AppState.currentState === 'active') {
      attempt();
      return;
    }
    const sub = AppState.addEventListener('change', (state) => state === 'active' && attempt());
    return () => sub.remove();
  }, [tryBiometric]);

  async function onChange(next: string) {
    setWrong(false);
    setCode(next);
    if (next.length < PASSCODE_LENGTH) return;
    if (await verifyPasscode(next)) {
      unlock();
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setWrong(true);
      setCode('');
    }
  }

  return (
    <View style={[styles.fill, styles.center, styles.screen, { backgroundColor: colors.surface1 }]} testID="a11.root">
      <Mascot mood={3} size={72} />
      <Text variant="title" align="center">
        {t('lock.title')}
      </Text>
      <Text variant="bodySm" color={wrong ? 'statusError' : 'inkMuted'} align="center" testID="a11.message">
        {wrong ? t('lock.wrong') : t('lock.passcode')}
      </Text>
      <PasscodePad value={code} onChange={(v) => void onChange(v)} screenId="a11" />
      {method && (
        <Button
          testID="a11.biometric"
          variant="secondary"
          label={t('lock.biometric', { method })}
          onPress={() => void tryBiometric(method)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  center: { alignItems: 'center', justifyContent: 'center' },
  screen: { gap: space[4], padding: space[6] },
});
