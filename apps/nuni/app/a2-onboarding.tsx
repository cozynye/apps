import { track } from '@nf/analytics';
import {
  Button,
  Illustration,
  layout,
  space,
  Text,
  useLayout,
  useSettings,
  useTheme,
  type IllustrationName,
} from '@nf/ui';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Switch, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppState } from '../src/app-state';

const PAGES = [1, 2, 3] as const;
const TEXT_MAX_WIDTH = 320;
const ILLUSTRATION_MAX_TABLET = 560;

/**
 * A2 onboarding: 3 pages, Skip, analytics toggle (default ON) above the last button.
 * No permission requests here (PLAN A2); the reminder prompt is A12 after the first save.
 */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors, accent } = useTheme();
  const { width, isTablet } = useLayout();
  const analyticsEnabled = useSettings((s) => s.analyticsEnabled);
  const setAnalyticsEnabled = useSettings((s) => s.setAnalyticsEnabled);
  const completeOnboarding = useAppState((s) => s.completeOnboarding);
  const pager = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const last = page === PAGES.length - 1;

  // Keep the current page in place when the width changes (iPad rotation).
  useEffect(() => {
    pager.current?.scrollTo({ x: page * width, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const illustrationWidth = Math.min(width - space[4] * 2, isTablet ? ILLUSTRATION_MAX_TABLET : Infinity);

  function finish() {
    track('onboarding_complete', { analytics_opt_in: useSettings.getState().analyticsEnabled });
    completeOnboarding();
    router.replace('/a3-home');
    // First success instead of an empty calendar: open A4 right away (PLAN 사용자 플로우).
    router.push({ pathname: '/a4-entry', params: { source: 'fab' } });
  }

  function next() {
    if (last) return finish();
    pager.current?.scrollTo({ x: (page + 1) * width, animated: true });
    setPage(page + 1);
  }

  function onScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.surface1 }]}>
      <View style={styles.topBar}>
        {!last && (
          <Pressable
            accessibilityRole="button"
            testID="a2.skip"
            onPress={finish}
            hitSlop={space[2]}
            style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Text variant="bodyStrong" color="inkMuted">
              {t('action.skip')}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        testID="a2.pager"
      >
        {PAGES.map((n) => (
          <ScrollView key={n} style={{ width }} contentContainerStyle={styles.page} testID={`a2.page${n}`}>
            <Illustration name={`nuni-onboarding-${n}` as IllustrationName} width={illustrationWidth} />
            <View style={styles.copy}>
              <Text variant="displayXl" align="center">
                {t(`onboarding.${n}.title`)}
              </Text>
              <Text variant="body" color="inkMuted" align="center">
                {t(`onboarding.${n}.body`)}
              </Text>
            </View>
          </ScrollView>
        ))}
      </ScrollView>

      <View style={[styles.bottom, isTablet && styles.bottomTablet]}>
        {last && (
          <View style={styles.analytics}>
            <View style={styles.analyticsText}>
              <Text variant="bodyStrong">{t('settings.analytics')}</Text>
              <Text variant="bodySm" color="inkMuted">
                {t('settings.analyticsHint')}
              </Text>
            </View>
            <Switch
              testID="a2.analytics"
              accessibilityLabel={t('settings.analytics')}
              value={analyticsEnabled}
              onValueChange={setAnalyticsEnabled}
              trackColor={{ true: accent.primary, false: colors.surface2 }}
              ios_backgroundColor={colors.surface2}
            />
          </View>
        )}
        <View style={styles.dots} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {PAGES.map((n, i) => (
            <View key={n} style={[styles.dot, { backgroundColor: i === page ? accent.primary : colors.line }]} />
          ))}
        </View>
        <Button
          testID={last ? 'a2.getStarted' : 'a2.continue'}
          label={last ? t('action.getStarted') : t('action.continue')}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

const DOT = 8;

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { minHeight: layout.touchMin, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: space[4] },
  skip: { minHeight: layout.touchMin, justifyContent: 'center' },
  // Illustration sits space-12 below the safe area; the Skip bar already takes touchMin of it.
  page: {
    alignItems: 'center',
    paddingTop: space[12] - layout.touchMin,
    paddingHorizontal: space[4],
    paddingBottom: space[4],
  },
  copy: { marginTop: space[8], gap: space[2], maxWidth: TEXT_MAX_WIDTH },
  bottom: { paddingHorizontal: space[4], paddingBottom: space[4], gap: space[6] },
  bottomTablet: { width: '100%', maxWidth: TEXT_MAX_WIDTH + space[4] * 2, alignSelf: 'center' },
  analytics: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  analyticsText: { flex: 1, gap: space[1] },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space[2] },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
});
