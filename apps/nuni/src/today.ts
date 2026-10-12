import { toLocalDateString } from '@nf/i18n';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Today's local date; updates at midnight and when the app returns to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(() => toLocalDateString(new Date()));
  useEffect(() => {
    const refresh = () => setToday(toLocalDateString(new Date()));
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const timer = setTimeout(refresh, midnight - now.getTime() + 1000);
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [today]);
  return today;
}
