import { useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { openTodayEntry } from '../../src/notification-responses';

/** Deep link `nuni://entry/today` (widget, reminder): A3 with A4 for today on top. */
export default function TodayLink() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  useEffect(() => {
    openTodayEntry(source === 'notification' ? 'notification' : 'widget');
  }, [source]);
  return null;
}
