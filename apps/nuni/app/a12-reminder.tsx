import { Button, Mascot, space, Text, useTheme } from '@nf/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { TimePicker } from '../src/components/TimePicker';
import { requestReminderPermission, useReminderSettings } from '../src/reminders';

/** A12: right after the first entry — pick a time (default 21:00), then the system prompt. */
export default function ReminderPrompt() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const settings = useReminderSettings();
  const [time, setTime] = useState({ hour: settings.hour, minute: settings.minute });
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true);
    settings.setTime(time);
    // Denied: the app works as before; Settings shows `permission.notificationsOff` (PLAN 예외).
    settings.setEnabled(await requestReminderPermission());
    router.back();
  }

  return (
    <ScrollView style={{ backgroundColor: colors.surface0 }} contentContainerStyle={styles.content}>
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
        <Button testID="a12.enable" label={t('onboarding.enableReminder')} loading={busy} onPress={() => void enable()} />
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
