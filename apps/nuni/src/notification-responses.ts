import { recordError, track } from '@nf/analytics';
import { i18next, toLocalDateString } from '@nf/i18n';
import { useToast, type Mood } from '@nf/ui';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { afterNewEntry, currentStreak } from './after-save';
import { saveEntry } from './entries';
import { QUICK_ACTION_PREFIX } from './reminders';

/** Opens A4 for today on top of A3 (reminder tap, `nuni://entry/today`). */
export function openTodayEntry(source: 'notification' | 'widget') {
  router.navigate('/a3-home');
  router.push({ pathname: '/a4-entry', params: { date: toLocalDateString(new Date()), source } });
}

/**
 * Reminder responses: a tap opens A4; Low / Okay / Good save an entry right away, without tags
 * (PLAN 사용자 플로우 › 매일 기록). Handles the response that launched the app, then live ones.
 */
export function useNotificationResponses() {
  const toast = useToast();
  useEffect(() => {
    async function quickSave(mood: Mood) {
      const before = await currentStreak();
      await saveEntry({ date: toLocalDateString(new Date()), mood, note: '', tagIds: [], photos: [] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      track('entry_create', { tag_count: 0, has_photo: false, has_note: false, source: 'notification' });
      toast(i18next.t('entry.saved'), 'success');
      router.navigate('/a3-home');
      await afterNewEntry(before);
    }

    function handle(response: Notifications.NotificationResponse) {
      Notifications.clearLastNotificationResponse();
      const action = response.actionIdentifier;
      if (action.startsWith(QUICK_ACTION_PREFIX)) {
        const mood = Number(action.slice(QUICK_ACTION_PREFIX.length)) as Mood;
        quickSave(mood).catch((error: Error) => {
          recordError(error, 'quickSave');
          toast(i18next.t('error.generic'), 'error');
        });
      } else if (action === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        openTodayEntry('notification');
      }
    }

    const launch = Notifications.getLastNotificationResponse();
    if (launch) handle(launch);
    const sub = Notifications.addNotificationResponseReceivedListener(handle);
    return () => sub.remove();
  }, [toast]);
}
