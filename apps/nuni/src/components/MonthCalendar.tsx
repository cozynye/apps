import { formatWeekdayDayMonth, fromLocalDateString, isLanguage, useTranslation } from '@nf/i18n';
import { Mascot, PressableSurface, radius, space, Text, useTheme, type Mood } from '@nf/ui';
import { StyleSheet, View } from 'react-native';

import { monthGrid } from '../dates';

const CLOUD = 28;

export interface MonthCalendarProps {
  month: Date;
  today: string;
  installDate: string;
  moods: Map<string, Mood>;
  /** Date picker use (A4): outlines this day. */
  selected?: string;
  onPressDay: (date: string) => void;
}

/**
 * A3 month grid (Monday first). Logged days show the `-sm` cloud of the representative entry,
 * empty days since install a dashed circle, days before install and future days only the number.
 */
export function MonthCalendar({ month, today, installDate, moods, selected, onPressDay }: MonthCalendarProps) {
  const { t } = useTranslation();
  const weekdays = t('home.weekdays', { returnObjects: true }) as string[];
  return (
    <View testID="a3.calendar">
      <View style={styles.row}>
        {weekdays.map((name) => (
          <Text key={name} variant="caption" color="inkMuted" align="center" style={styles.weekday}>
            {name}
          </Text>
        ))}
      </View>
      {monthGrid(month).map((week, i) => (
        <View key={i} style={styles.row}>
          {week.map((date, j) =>
            date ? (
              <DayCell
                key={date}
                date={date}
                mood={moods.get(date)}
                isToday={date === today}
                isSelected={date === selected}
                isFuture={date > today}
                beforeInstall={date < installDate}
                onPress={() => onPressDay(date)}
              />
            ) : (
              <View key={`empty-${j}`} style={styles.cell} />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

interface DayCellProps {
  date: string;
  mood: Mood | undefined;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  beforeInstall: boolean;
  onPress: () => void;
}

function DayCell({ date, mood, isToday, isSelected, isFuture, beforeInstall, onPress }: DayCellProps) {
  const { t, i18n } = useTranslation();
  const { colors, accent } = useTheme();
  const day = Number(date.slice(8));
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  const label = [
    formatWeekdayDayMonth(language, fromLocalDateString(date)),
    mood ? t(`mood.${mood}`) : null,
  ]
    .filter(Boolean)
    .join(', ');

  let mark: React.ReactNode = null;
  if (mood) mark = <Mascot mood={mood} size={CLOUD} />;
  else if (!isFuture && !beforeInstall) {
    mark = <View style={[styles.dashed, { borderColor: isToday ? accent.deep : colors.line }]} />;
  }

  return (
    <PressableSurface
      testID={`a3.day.${date}`}
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected || isToday, disabled: isFuture }}
      disabled={isFuture}
      onPress={onPress}
      style={[
        styles.cell,
        styles.day,
        isToday && { backgroundColor: accent.soft },
        isSelected && { borderWidth: 2, borderColor: accent.deep },
      ]}
    >
      <View style={styles.mark}>{mark}</View>
      <Text
        variant="caption"
        align="center"
        color={isFuture ? 'inkDisabled' : 'inkMuted'}
        style={isToday && { color: accent.deep }}
      >
        {day}
      </Text>
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  weekday: { flex: 1, paddingVertical: space[2] },
  cell: { flex: 1, minHeight: 60 },
  day: { alignItems: 'center', justifyContent: 'center', gap: space[1], borderRadius: radius.md },
  mark: { width: CLOUD, height: CLOUD, alignItems: 'center', justifyContent: 'center' },
  dashed: { width: CLOUD, height: CLOUD, borderRadius: CLOUD / 2, borderWidth: 1.5, borderStyle: 'dashed' },
});
