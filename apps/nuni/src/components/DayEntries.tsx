import { formatWeekdayDayMonth, fromLocalDateString, intlLocale, isLanguage, type Language } from '@nf/i18n';
import { Button, IconButton, Mascot, PressableSurface, radius, space, Text, useTheme, useToast, XIcon } from '@nf/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { deleteEntry } from '../entries';
import { useDayEntries, type DayEntry } from '../queries';

const DELETE_WIDTH = 88;

export interface DayEntriesProps {
  date: string;
  /** testID prefix: `a5` in the sheet, `a3` in the iPad side panel. */
  screenId: string;
  onClose?: () => void;
}

/**
 * Entries of one day, newest first (the newest is the calendar cloud), with "Add another entry".
 * Used by the A5 sheet and by A3's right column on wide iPad layouts.
 */
export function DayEntries({ date, screenId, onClose }: DayEntriesProps) {
  const { t, i18n } = useTranslation();
  const entries = useDayEntries(date);
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  return (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title} testID={`${screenId}.dayTitle`}>
          {formatWeekdayDayMonth(language, fromLocalDateString(date))}
        </Text>
        {onClose && (
          <IconButton
            testID={`${screenId}.close`}
            accessibilityLabel={t('a11y.close')}
            onPress={onClose}
            renderIcon={(c) => <XIcon size={24} color={c} />}
          />
        )}
      </View>
      {entries.map((entry) => (
        <EntryRow key={entry.id} entry={entry} language={language} screenId={screenId} />
      ))}
      <Button
        testID={`${screenId}.addAnother`}
        variant="secondary"
        label={t('entry.addAnother')}
        onPress={() => router.push({ pathname: '/a4-entry', params: { date, source: 'calendar' } })}
      />
    </View>
  );
}

/**
 * Swipe left to reveal Delete (plain horizontal ScrollView, no gesture library). Status colors stay
 * on text only (DESIGN_SYSTEM 상태).
 */
function EntryRow({ entry, language, screenId }: { entry: DayEntry; language: Language; screenId: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const [rowWidth, setRowWidth] = useState(0);
  const time = new Intl.DateTimeFormat(intlLocale(language), { hour: 'numeric', minute: '2-digit' }).format(
    entry.createdAt,
  );
  const tagNames = entry.tags.map((tag) => (tag.nameKey ? t(tag.nameKey) : (tag.customName ?? '')));

  function confirmDelete() {
    Alert.alert(t('entry.deleteConfirm'), undefined, [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('action.delete'),
        style: 'destructive',
        onPress: () => void deleteEntry(entry.id).catch(() => toast(t('error.generic'), 'error')),
      },
    ]);
  }

  return (
    <View onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToOffsets={[0, DELETE_WIDTH]}
        decelerationRate="fast"
        bounces={false}
        testID={`${screenId}.row.${entry.id}`}
      >
        <PressableSurface
          testID={`${screenId}.entry.${entry.id}`}
          accessibilityLabel={[t(`mood.${entry.mood}`), time, ...tagNames, entry.note].filter(Boolean).join(', ')}
          accessibilityActions={[{ name: 'delete', label: t('action.delete') }]}
          onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && confirmDelete()}
          onPress={() => router.push({ pathname: '/a4-entry', params: { id: entry.id } })}
          style={[styles.row, { width: rowWidth, borderColor: colors.line, backgroundColor: colors.surface0 }]}
        >
          <Mascot mood={entry.mood} size={40} />
          <View style={styles.rowText}>
            <Text variant="bodyStrong">
              {t(`mood.${entry.mood}`)}
              <Text variant="bodySm" color="inkMuted">{`  ${time}`}</Text>
            </Text>
            {tagNames.length > 0 && (
              <Text variant="bodySm" color="inkMuted">
                {tagNames.join(' · ')}
              </Text>
            )}
            {entry.note && <Text variant="body">{entry.note}</Text>}
          </View>
        </PressableSurface>
        <PressableSurface
          testID={`${screenId}.delete.${entry.id}`}
          accessibilityLabel={t('action.delete')}
          onPress={confirmDelete}
          style={[styles.delete, { backgroundColor: colors.surface2 }]}
        >
          <Text variant="bodyStrong" style={{ color: colors.statusError }}>
            {t('action.delete')}
          </Text>
        </PressableSurface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[3] },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
  row: {
    flexDirection: 'row',
    gap: space[3],
    padding: space[4],
    borderWidth: 1,
    borderRadius: radius.md,
  },
  rowText: { flex: 1, gap: space[1] },
  delete: {
    width: DELETE_WIDTH - space[2],
    marginLeft: space[2],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
