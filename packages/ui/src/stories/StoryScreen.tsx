import { LANGUAGE_AUTONYMS, SUPPORTED_LANGUAGES, type Language } from '@nf/i18n';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { Illustration, Mascot, type Mood } from '../components/Mascot';
import { PlanCard } from '../components/PlanCard';
import { PressableSurface } from '../components/PressableSurface';
import { Screen } from '../components/Screen';
import { Segment } from '../components/Segment';
import { Text } from '../components/Text';
import { useToast } from '../components/Toast';
import { radius, space, type TypographyName } from '../generated/tokens';
import { PlusIcon, XIcon } from '../icons';
import { useLayout } from '../layout';
import { useSettings, type Appearance } from '../settings';
import { useTheme } from '../theme';

const MOODS: Mood[] = [1, 2, 3, 4, 5];
const TYPE_SAMPLES: TypographyName[] = ['displayXl', 'displayLg', 'title', 'body', 'bodyStrong', 'bodySm', 'caption', 'button'];

/**
 * Dev-only component gallery (S1 완료 조건: renders on iPhone and iPad).
 * Section headings are developer labels; sample content uses real i18n keys.
 */
export function StoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width, isTablet } = useLayout();
  const toast = useToast();
  const { appearance, setAppearance, language, setLanguage } = useSettings();
  const [chip, setChip] = useState(true);
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [segment, setSegment] = useState<'week' | 'month'>('month');
  const illustrationWidth = Math.min(width - space[4] * 2, 560);

  return (
    <Screen scroll testID="story.root">
      <View style={styles.stack}>
        <Text variant="caption" color="inkMuted" testID="story.info">
          {`${theme.app} · ${theme.scheme} · ${width}pt · ${isTablet ? 'tablet' : 'phone'}`}
        </Text>

        <Segment<Language | 'system'>
          testID="story.language"
          value={language ?? 'system'}
          onChange={(v) => setLanguage(v === 'system' ? null : v)}
          options={[
            { value: 'system', label: t('settings.languageSystem') },
            ...SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_AUTONYMS[l] })),
          ]}
        />
        <Segment<Appearance>
          testID="story.appearance"
          value={appearance}
          onChange={setAppearance}
          options={[
            { value: 'system', label: t('settings.appearanceSystem') },
            { value: 'light', label: t('settings.appearanceLight') },
            { value: 'dark', label: t('settings.appearanceDark') },
          ]}
        />

        <Section title="Typography">
          {TYPE_SAMPLES.map((variant) => (
            <Text key={variant} variant={variant}>
              {t('error.storageFull')}
            </Text>
          ))}
        </Section>

        <Section title="Buttons">
          <Button testID="story.primary" label={t('action.getStarted')} onPress={() => toast(t('paywall.purchaseSuccess'), 'success')} />
          <Button testID="story.disabled" label={t('action.save')} disabled />
          <Button testID="story.secondary" variant="secondary" label={t('settings.restorePurchases')} onPress={() => toast(t('error.generic'), 'error')} />
          <Button testID="story.loading" label={t('action.save')} loading />
          <View style={styles.row}>
            <IconButton testID="story.close" accessibilityLabel={t('a11y.close')} renderIcon={(c) => <XIcon size={24} color={c} />} />
            <View style={[styles.fab, theme.shadowFloat, { backgroundColor: theme.accent.primary }]}>
              <IconButton
                testID="story.fab"
                accessibilityLabel={t('a11y.newEntry')}
                renderIcon={() => <PlusIcon size={28} color={theme.colors.onAccent} />}
              />
            </View>
          </View>
        </Section>

        <Section title="Chips & segment">
          <View style={styles.wrap}>
            <Chip testID="story.chip1" label={t('action.share')} selected={chip} onPress={() => setChip(!chip)} />
            <Chip testID="story.chip2" label={t('action.edit')} />
            <Chip testID="story.chip3" label={t('settings.notifications')} />
          </View>
          <Segment
            testID="story.segment"
            value={segment}
            onChange={(v) => (v === 'year' ? toast(t('paywall.restore')) : setSegment(v))}
            options={[
              { value: 'week', label: t('paywall.monthly') },
              { value: 'month', label: t('paywall.yearly') },
              { value: 'year', label: t('settings.subscription'), locked: true },
            ]}
          />
        </Section>

        <Section title="Card & pressable">
          <Card>
            <Text variant="title">{t('settings.backup')}</Text>
            <Text variant="bodySm" color="inkMuted">{t('error.offline')}</Text>
          </Card>
          <PressableSurface testID="story.row" style={[styles.pressRow, { borderColor: theme.colors.line }]}>
            <Text>{t('settings.language')}</Text>
          </PressableSurface>
        </Section>

        <Section title="Mascot">
          <View style={styles.row}>
            {MOODS.map((m) => (
              <Mascot key={m} mood={m} size={56} accessibilityLabel={t(`mood.${m}`, { defaultValue: String(m) })} />
            ))}
          </View>
          <View style={styles.row}>
            {MOODS.map((m) => (
              <Mascot key={m} mood={m} size={28} />
            ))}
          </View>
        </Section>

        <Section title="Illustration">
          <Illustration name={theme.app === 'nuni' ? 'nuni-onboarding-1' : 'fourpop-onboarding-1'} width={illustrationWidth} />
        </Section>

        <Section title="Paywall plan cards">
          <PlanCard testID="story.planYearly" title={t('paywall.yearly')} subtitle={t('paywall.perYear', { price: '—' })} badge={t('paywall.savePercent', { percent: 0 })} trailing={t('paywall.perMonthEquivalent', { price: '—' })} selected={plan === 'yearly'} onPress={() => setPlan('yearly')} />
          <PlanCard testID="story.planMonthly" title={t('paywall.monthly')} subtitle={t('paywall.perMonth', { price: '—' })} selected={plan === 'monthly'} onPress={() => setPlan('monthly')} />
        </Section>

        <Section title="Empty state">
          <Card>
            <EmptyState
              testID="story.empty"
              art={<Mascot mood={3} size={120} />}
              title={t('error.offline')}
              body={t('error.purchaseOffline')}
              actionLabel={t('action.retry')}
              onAction={() => toast(t('action.retry'))}
            />
          </Card>
        </Section>
      </View>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="bodyStrong" color="inkMuted">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: space[5], paddingVertical: space[6] },
  section: { gap: space[3] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  fab: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  pressRow: { borderWidth: 1, borderRadius: radius.md, padding: space[4] },
});
