import { CaretLeftIcon, IconButton, Screen, SettingsRow, SettingsSection, space, Text, useTheme } from '@nf/ui';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { PasscodePad } from '../../src/components/PasscodePad';
import { clearPasscode, PASSCODE_LENGTH, setPasscode, useLockSettings, verifyPasscode } from '../../src/lock';

/** verify → (set → confirm): enabling sets a passcode; disabling and changing ask for the current one. */
type Step =
  | { kind: 'idle' }
  | { kind: 'verify'; then: 'disable' | 'change' }
  | { kind: 'set' }
  | { kind: 'confirm'; first: string };

/** Settings › App lock (PLAN 라우트 `settings/lock`). Face ID / Touch ID is used automatically when enrolled. */
export default function LockSettings() {
  const { t } = useTranslation();
  const { colors, accent } = useTheme();
  const { enabled, setEnabled } = useLockSettings();
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  function fail(message: string, next: Step) {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setError(message);
    setCode('');
    setStep(next);
  }

  async function onCode(next: string) {
    setError(null);
    setCode(next);
    if (next.length < PASSCODE_LENGTH) return;
    setCode('');
    if (step.kind === 'verify') {
      if (!(await verifyPasscode(next))) return fail(t('lock.wrong'), step);
      if (step.then === 'disable') {
        await clearPasscode();
        setEnabled(false);
        return setStep({ kind: 'idle' });
      }
      return setStep({ kind: 'set' });
    }
    if (step.kind === 'set') return setStep({ kind: 'confirm', first: next });
    if (step.kind === 'confirm') {
      if (next !== step.first) return fail(t('settings.passcodeMismatch'), { kind: 'set' });
      await setPasscode(next);
      setEnabled(true);
      setStep({ kind: 'idle' });
    }
  }

  const prompt =
    step.kind === 'verify'
      ? t('lock.passcode')
      : step.kind === 'set'
        ? t('settings.passcodeSet')
        : t('settings.passcodeConfirm');

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton
          testID="lock.back"
          accessibilityLabel={t('action.back')}
          onPress={() => (step.kind === 'idle' ? router.back() : setStep({ kind: 'idle' }))}
          renderIcon={(c) => <CaretLeftIcon size={24} color={c} />}
        />
        <Text variant="title">{t('settings.appLock')}</Text>
      </View>
      {step.kind === 'idle' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <SettingsSection>
            <SettingsRow
              testID="lock.toggle"
              label={t('settings.appLock')}
              hint={t('settings.appLockHint')}
              accessory={
                <Switch
                  testID="lock.switch"
                  accessibilityLabel={t('settings.appLock')}
                  value={enabled}
                  onValueChange={(on) => setStep(on ? { kind: 'set' } : { kind: 'verify', then: 'disable' })}
                  trackColor={{ true: accent.deep, false: colors.surface2 }}
                  ios_backgroundColor={colors.surface2}
                />
              }
            />
            {enabled && (
              <SettingsRow
                testID="lock.change"
                label={t('settings.passcodeChange')}
                onPress={() => setStep({ kind: 'verify', then: 'change' })}
              />
            )}
          </SettingsSection>
          {/* PLAN 예외: tell people up front that a forgotten passcode cannot be recovered. */}
          <Text variant="bodySm" color="inkMuted" testID="lock.noRecovery">
            {t('settings.passcodeNoRecovery')}
          </Text>
        </ScrollView>
      ) : (
        <View style={styles.pad}>
          <Text variant="title" align="center" testID="lock.prompt">
            {prompt}
          </Text>
          <Text variant="bodySm" color="statusError" align="center" testID="lock.error">
            {error ?? ' '}
          </Text>
          <PasscodePad value={code} onChange={(v) => void onCode(v)} screenId="lock" />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space[2], paddingVertical: space[2] },
  content: { gap: space[3], paddingTop: space[4] },
  pad: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[4] },
});
