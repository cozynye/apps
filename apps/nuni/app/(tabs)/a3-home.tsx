import { formatMonthYear, fromLocalDateString, isLanguage, toLocalDateString } from '@nf/i18n';
import {
  Card,
  CaretLeftIcon,
  CaretRightIcon,
  CloudIcon,
  IconButton,
  layout,
  Mascot,
  PlusIcon,
  PressableSurface,
  radius,
  Screen,
  space,
  Text,
  useLayout,
  useTheme,
} from '@nf/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '../../src/app-state';
import { DayEntries } from '../../src/components/DayEntries';
import { MonthCalendar } from '../../src/components/MonthCalendar';
import { addMonths, monthGrid, startOfMonth } from '../../src/dates';
import { useCalendarMoods, useEntryDates, useLatestEntry } from '../../src/queries';
import { computeStreak } from '../../src/streak';
import { useToday } from '../../src/today';

const FAB = 56;

/**
 * A3 home: month calendar, streak chip, today card, + FAB. From 1024pt wide (iPad) the selected
 * day's entries sit in a right column (calendar 60% / day 40%, PLAN iPad 대응).
 */
export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors, accent, shadowFloat } = useTheme();
  const today = useToday();
  const insets = useSafeAreaInsets();
  const installDate = useAppState((s) => s.installDate);
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  // Crossing into a new month while the current month is shown: move along with "today".
  const [shownToday, setShownToday] = useState(today);
  if (shownToday !== today) {
    if (shownToday.slice(0, 7) === toLocalDateString(month).slice(0, 7))
      setMonth(startOfMonth(fromLocalDateString(today)));
    setShownToday(today);
  }
  const { isWide, width } = useLayout();
  const [selected, setSelected] = useState<string | null>(null);
  const selectedDay = selected ?? today;

  const days = monthGrid(month)
    .flat()
    .filter((d): d is string => d !== null);
  const moods = useCalendarMoods(days[0]!, days.at(-1)!);
  const dates = useEntryDates();
  const streak = computeStreak(dates, today).current;
  const todayEntry = useLatestEntry(today);
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  const isCurrentMonth = days.includes(today);

  function openNew(date: string, source: 'fab' | 'calendar') {
    router.push({ pathname: '/a4-entry', params: { date, source } });
  }

  function onPressDay(date: string) {
    if (!moods.has(date)) openNew(date, 'calendar');
    else if (isWide) setSelected(date);
    else router.push({ pathname: '/a5-entry/[date]', params: { date } });
  }

  return (
    <Screen edges={['top']} maxWidth={isWide ? width : layout.layoutMaxContent}>
      <View style={styles.columns}>
        <ScrollView
          style={styles.main}
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <IconButton
              testID="a3.prevMonth"
              accessibilityLabel={t('a11y.prevMonth')}
              onPress={() => setMonth(addMonths(month, -1))}
              renderIcon={(c) => <CaretLeftIcon size={24} color={c} />}
            />
            {/* One line: shrink rather than wrap so the arrows don't jump when the streak chip appears. */}
            <Text
              variant="displayLg"
              testID="a3.title"
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatMonthYear(language, month)}
            </Text>
            <IconButton
              testID="a3.nextMonth"
              accessibilityLabel={t('a11y.nextMonth')}
              disabled={isCurrentMonth}
              onPress={() => setMonth(addMonths(month, 1))}
              renderIcon={(c) => <CaretRightIcon size={24} color={c} />}
            />
            <View style={styles.spacer} />
            {streak > 0 && (
              <View
                testID="a3.streak"
                accessible
                accessibilityLabel={t('home.streakLabel', { count: streak })}
                style={[styles.chip, { backgroundColor: accent.soft }]}
              >
                <CloudIcon size={16} color={accent.deep} weight="fill" />
                <Text variant="bodySm" style={{ color: accent.deep }}>
                  {t('home.streak', { count: streak })}
                </Text>
              </View>
            )}
          </View>

          <Card style={styles.calendar}>
            <MonthCalendar
              month={month}
              today={today}
              installDate={installDate}
              moods={moods}
              selected={isWide ? selectedDay : undefined}
              onPressDay={onPressDay}
            />
          </Card>
          {dates.length === 0 && (
            <Text variant="bodySm" color="inkMuted" align="center" testID="a3.firstCloud">
              {t('home.firstCloud')}
            </Text>
          )}

          <PressableSurface
            testID="a3.today"
            onPress={() =>
              todayEntry
                ? router.push({ pathname: '/a4-entry', params: { id: todayEntry.id } })
                : openNew(today, 'calendar')
            }
            style={[styles.todayCard, { backgroundColor: colors.surface0, borderColor: colors.line }]}
          >
            {todayEntry ? <Mascot mood={todayEntry.mood} size={40} /> : <CloudIcon size={40} color={colors.inkMuted} />}
            <View style={styles.todayText}>
              {todayEntry ? (
                <Text variant="bodyStrong">
                  {t('home.todayLogged', { mood: t(`mood.${todayEntry.mood}`), count: todayEntry.tagCount })}
                </Text>
              ) : (
                <>
                  <Text variant="bodyStrong">{t('home.todayPrompt')}</Text>
                  <Text variant="bodySm" color="inkMuted">
                    {t('home.todayHint')}
                  </Text>
                </>
              )}
            </View>
            {todayEntry && (
              <Text variant="bodySm" style={{ color: accent.deep }}>
                {t('home.editEntry')}
              </Text>
            )}
            <CaretRightIcon size={20} color={colors.inkMuted} />
          </PressableSurface>
        </ScrollView>
        {isWide && (
          <ScrollView
            style={styles.side}
            contentContainerStyle={styles.content}
            contentInsetAdjustmentBehavior="automatic"
          >
            <DayEntries date={selectedDay} screenId="a3" />
          </ScrollView>
        )}
      </View>

      <Pressable
        testID="a3.fab"
        accessibilityRole="button"
        accessibilityLabel={t('a11y.newEntry')}
        onPress={() => openNew(today, 'fab')}
        style={({ pressed }) => [
          styles.fab,
          // Above the floating native tab bar (part of the bottom safe area).
          { bottom: insets.bottom + space[4] },
          shadowFloat,
          { backgroundColor: accent.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <PlusIcon size={28} color={colors.onAccent} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  columns: { flex: 1, flexDirection: 'row', gap: space[6] },
  main: { flex: 3 },
  side: { flex: 2 },
  content: { gap: space[5], paddingTop: space[4], paddingBottom: FAB + space[8] },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flexShrink: 1 },
  spacer: { flex: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    minHeight: 36,
    paddingHorizontal: space[3],
    borderRadius: radius.pill,
  },
  calendar: { paddingHorizontal: space[2] },
  todayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[4],
    borderWidth: 1,
    borderRadius: radius.md,
  },
  todayText: { flex: 1, gap: space[1] },
  fab: {
    position: 'absolute',
    right: space[4],
    width: FAB,
    height: FAB,
    borderRadius: FAB / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
