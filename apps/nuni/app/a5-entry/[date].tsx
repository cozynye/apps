import { space, useTheme } from '@nf/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { DayEntries } from '../../src/components/DayEntries';
import { useDayEntries } from '../../src/queries';

/** A5: all entries of one day (sheet). */
export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { colors } = useTheme();

  // The last entry was deleted: nothing left to show.
  const empty = useDayEntries(date).length === 0;
  useEffect(() => {
    if (empty) {
      const timer = setTimeout(() => router.canGoBack() && router.back(), 300);
      return () => clearTimeout(timer);
    }
  }, [empty]);

  return (
    <ScrollView style={{ backgroundColor: colors.surface0 }} contentContainerStyle={styles.content}>
      <DayEntries date={date} screenId="a5" onClose={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ content: { padding: space[4], paddingBottom: space[8] } });
