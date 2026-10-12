import { formatMonth, formatWeekdayDayMonth, fromLocalDateString, isLanguage } from '@nf/i18n';
import { useEntitlement } from '@nf/purchases';
import {
  Button,
  Card,
  ExportIcon,
  LockSimpleIcon,
  Mascot,
  radius,
  Screen,
  Segment,
  space,
  Text,
  useTheme,
  type ColorName,
  type Mood,
} from '@nf/ui';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useEntryDates, usePeriodData, useTags } from '../../src/queries';
import { computeStreak } from '../../src/streak';
import { moodDistribution, moodLifts, periodRange, type Period } from '../../src/stats';
import { useToday } from '../../src/today';

const MOODS: Mood[] = [1, 2, 3, 4, 5];
const moodColor = (mood: Mood) => `mood${mood}` as ColorName;

/** A6 stats: Week / Month / Year (Premium), mood distribution, streaks, what lifts your mood. */
export default function StatsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const premium = useEntitlement('mood_premium');
  const today = useToday();
  const [period, setPeriod] = useState<Period>('month');
  const { from, to } = periodRange(period, today);
  const data = usePeriodData(from, to);
  const streak = computeStreak(useEntryDates(), today);
  const language = isLanguage(i18n.language) ? i18n.language : 'en';

  const label =
    period === 'month'
      ? formatMonth(language, fromLocalDateString(today))
      : period === 'year'
        ? today.slice(0, 4)
        : `${formatWeekdayDayMonth(language, fromLocalDateString(from))} – ${formatWeekdayDayMonth(language, fromLocalDateString(to))}`;

  function selectPeriod(next: Period) {
    if (next === 'year' && !premium) {
      router.push({ pathname: '/a9-paywall', params: { source: 'year' } });
      return;
    }
    setPeriod(next);
  }

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text variant="displayLg" testID="a6.title" style={styles.title}>
            {t('stats.title')}
          </Text>
          <Pressable
            testID="a6.share"
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/a7-share', params: { period: 'month' } })}
            style={({ pressed }) => [
              styles.share,
              { borderColor: colors.line, backgroundColor: pressed ? colors.surface2 : colors.surface0 },
            ]}
          >
            <ExportIcon size={18} color={colors.ink} />
            <Text variant="bodySm">{t('stats.share')}</Text>
          </Pressable>
        </View>

        <Segment
          testID="a6.period"
          value={period}
          onChange={selectPeriod}
          options={[
            { value: 'week', label: t('stats.week') },
            { value: 'month', label: t('stats.month') },
            { value: 'year', label: t('stats.year'), locked: !premium },
          ]}
        />

        <DistributionCard label={period === 'year' ? t('stats.yearTitle') : label} data={data} />

        <View style={styles.streaks}>
          <StreakCard testID="a6.currentStreak" title={t('stats.currentStreak')} days={streak.current} />
          <StreakCard testID="a6.bestStreak" title={t('stats.bestStreak')} days={streak.best} />
        </View>

        {premium ? <LiftsCard data={data} /> : <LockedLiftsCard />}
      </ScrollView>
    </Screen>
  );
}

function DistributionCard({ label, data }: { label: string; data: ReturnType<typeof usePeriodData> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { counts, days } = moodDistribution(data.entries);
  return (
    <Card testID="a6.distribution" style={styles.card}>
      <View style={styles.cardHeader}>
        <Text variant="title" style={styles.title}>
          {label}
        </Text>
        <Text variant="bodySm" color="inkMuted" testID="a6.daysLogged">
          {t('stats.daysLogged', { count: days })}
        </Text>
      </View>
      {days === 0 ? (
        <View style={styles.empty}>
          <Mascot mood={3} size={48} />
          <Text variant="bodySm" color="inkMuted" align="center">
            {t('stats.emptyPeriod')}
          </Text>
          <Button
            testID="a6.log"
            label={t('home.todayPrompt')}
            onPress={() => router.push({ pathname: '/a4-entry', params: { source: 'fab' } })}
          />
        </View>
      ) : (
        <>
          {/* Adjacent mood colors are close in lightness, so segments are separated by `line`. */}
          <View
            style={[styles.bar, { backgroundColor: colors.line }]}
            accessible
            accessibilityLabel={MOODS.map((m) => `${t(`mood.${m}`)} ${counts[m]}`).join(', ')}
          >
            {MOODS.filter((m) => counts[m] > 0).map((m) => (
              <View key={m} style={{ flex: counts[m], backgroundColor: colors[moodColor(m)] }} />
            ))}
          </View>
          <View style={styles.counts}>
            {MOODS.map((m) => (
              <View key={m} style={styles.count}>
                <Mascot mood={m} size={28} accessibilityLabel={t(`mood.${m}`)} />
                <Text variant="bodyStrong" testID={`a6.count.${m}`}>
                  {counts[m]}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

function StreakCard({ title, days, testID }: { title: string; days: number; testID: string }) {
  const { t } = useTranslation();
  return (
    <Card style={[styles.card, styles.streakCard]} testID={testID}>
      <Text variant="bodySm" color="inkMuted">
        {title}
      </Text>
      <Text variant="displayLg">{t('home.streak', { count: days })}</Text>
    </Card>
  );
}

function LiftsCard({ data }: { data: ReturnType<typeof usePeriodData> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const tags = useTags();
  const lifts = moodLifts(data.entries, data.entryTags);
  return (
    <Card testID="a6.lifts" style={styles.card}>
      <Text variant="title">{t('stats.liftsTitle')}</Text>
      {lifts.length === 0 ? (
        <Text variant="bodySm" color="inkMuted">
          {t('stats.liftsEmpty')}
        </Text>
      ) : (
        lifts.map((lift) => {
          const tag = tags.find((x) => x.id === lift.tagId);
          const name = tag?.nameKey ? t(tag.nameKey) : (tag?.customName ?? '');
          const mood = Math.round(lift.average) as Mood;
          return (
            <View
              key={lift.tagId}
              style={styles.liftRow}
              accessible
              accessibilityLabel={`${name}, ${t(`mood.${mood}`)}`}
            >
              <Text variant="bodySm" style={styles.liftName} numberOfLines={2}>
                {name}
              </Text>
              <View style={[styles.liftTrack, { backgroundColor: colors.surface2 }]}>
                <View
                  style={[
                    styles.liftFill,
                    { width: `${(lift.average / 5) * 100}%`, backgroundColor: colors[moodColor(mood)] },
                  ]}
                />
              </View>
              <Mascot mood={mood} size={24} />
            </View>
          );
        })
      )}
    </Card>
  );
}

/** Free users see a blurred sample (never their data) and the trial button (PLAN A6). */
function LockedLiftsCard() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const sample = [0.8, 0.65, 0.45, 0.3];
  return (
    <Card testID="a6.liftsLocked" style={[styles.card, styles.locked]}>
      <Text variant="title" color="inkMuted">
        {t('stats.liftsTitle')}
      </Text>
      {sample.map((w, i) => (
        <View key={i} style={styles.liftRow}>
          <View style={[styles.sampleName, { backgroundColor: colors.surface2 }]} />
          <View style={[styles.liftTrack, { backgroundColor: colors.surface2 }]}>
            <View style={[styles.liftFill, { width: `${w * 100}%`, backgroundColor: colors.mood4 }]} />
          </View>
        </View>
      ))}
      <BlurView intensity={24} tint={scheme} style={StyleSheet.absoluteFill} />
      <View style={styles.lockOverlay}>
        <LockSimpleIcon size={24} color={colors.ink} />
        <Text variant="bodyStrong" align="center">
          {t('stats.liftsLocked')}
        </Text>
        <Button
          testID="a6.tryPremium"
          label={t('stats.tryPremium')}
          onPress={() => router.push({ pathname: '/a9-paywall', params: { source: 'lifts' } })}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[5], paddingTop: space[4], paddingBottom: space[8] },
  header: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  title: { flex: 1 },
  share: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    minHeight: 44,
    paddingHorizontal: space[4],
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  card: { gap: space[4] },
  cardHeader: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: space[2] },
  bar: { flexDirection: 'row', height: 16, borderRadius: radius.pill, overflow: 'hidden', gap: 2 },
  counts: { flexDirection: 'row' },
  count: { flex: 1, alignItems: 'center', gap: space[1] },
  empty: { alignItems: 'center', gap: space[3] },
  streaks: { flexDirection: 'row', gap: space[4] },
  streakCard: { flex: 1, gap: space[1] },
  liftRow: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  liftName: { width: 88 },
  liftTrack: { flex: 1, height: 12, borderRadius: radius.pill, overflow: 'hidden' },
  liftFill: { height: '100%', borderRadius: radius.pill },
  sampleName: { width: 72, height: 12, borderRadius: radius.pill },
  locked: { overflow: 'hidden' },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[3],
    padding: space[4],
  },
});
