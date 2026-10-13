import { Button, Mascot, space, Text, useTheme } from '@nf/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimePicker } from '../src/components/TimePicker';
import { requestReminderPermission, useReminderSettings } from '../src/reminders';

/** A12: right after the first entry — pick a time (default 21:00), then the system prompt. */
export default function ReminderPrompt() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const settings = useReminderSettings();
  const [time, setTime] = useState({ hour: settings.hour, minute: settings.minute });
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();

  async function enable() {
    setBusy(true);
    settings.setTime(time);
    // The choice stays on even if iOS permission is denied; Settings then shows
    // `permission.notificationsOff` + Open Settings (PLAN 예외 › 알림 권한 거부).
    settings.setEnabled(true);
    await requestReminderPermission();
    router.back();
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.surface0 }}
      contentContainerStyle={[styles.content, { paddingBottom: space[6] + insets.bottom }]}
    >
      <Mascot mood={4} size={72} />
      <View style={styles.copy}>
        <Text variant="title" align="center" testID="a12.title">
          {t('reminder.title')}
        </Text>
        <Text variant="body" color="inkMuted" align="center">
          {t('reminder.body')}
        </Text>
      </View>
      <View style={styles.picker}>
        <Text variant="bodySm" color="inkMuted">
          {t('onboarding.reminderTime')}
        </Text>
        <TimePicker testID="a12.time" value={time} onChange={setTime} />
      </View>
      <View style={styles.buttons}>
        <Button
          testID="a12.enable"
          label={t('onboarding.enableReminder')}
          loading={busy}
          onPress={() => void enable()}
        />
        <Button testID="a12.notNow" variant="secondary" label={t('action.notNow')} onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space[6], gap: space[5], alignItems: 'center' },
  copy: { gap: space[2], maxWidth: 360 },
  picker: { alignItems: 'center', gap: space[1] },
  buttons: { alignSelf: 'stretch', gap: space[3] },
});
