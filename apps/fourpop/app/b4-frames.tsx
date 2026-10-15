import { isAvailableOn, type FrameItem, type FramePack } from '@nf/content';
import { isLanguage, toLocalDateString } from '@nf/i18n';
import { canUsePack, MONETIZATION, useEntitlementStore } from '@nf/purchases';
import {
  EmptyState,
  IconButton,
  Segment,
  space,
  SparkleIcon,
  storage,
  Text,
  useLayout,
  useTheme,
  useToast,
  XIcon,
} from '@nf/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { useFrameChoice } from '../src/booth';
import { framePacks, imageSource, PREMIUM, useCatalog } from '../src/catalog';
import { FrameGrid } from '../src/components/FrameGrid';

type Tab = 'basics' | 'season' | 'owned';
const LOCKED_HINT_KEY = 'booth.lockedHintShown';

/** B4 frame picker (sheet): Basics / Season / Owned. Locked frames can be chosen (PLAN B4). */
export default function FramesScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const { isTablet } = useLayout();
  const packs = framePacks(useCatalog((s) => s.packs));
  const snapshot = useEntitlementStore();
  const { frameId, setFrame } = useFrameChoice();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'season' || params.tab === 'owned' ? params.tab : 'basics');
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  const today = toLocalDateString(new Date());

  const [now] = useState(Date.now);
  const usable = (p: FramePack) => !MONETIZATION || canUsePack(snapshot, p, PREMIUM, now);
  const shown: FramePack[] =
    tab === 'basics'
      ? packs.filter((p) => p.category === 'basic')
      : tab === 'season'
        ? // Free 1.0: season packs show only inside their window; with purchases on, owned ones stay (PLAN 예외).
          packs.filter((p) => p.category !== 'basic' && (isAvailableOn(p, today) || (MONETIZATION && usable(p))))
        : packs.filter((p) => !p.free && usable(p));

  async function select(item: FrameItem, locked: boolean) {
    const source = imageSource(item.image);
    // CDN frames: fetch the one frame image now (PLAN 사용자 플로우 1); bundled ones are local.
    if (typeof source === 'object' && 'uri' in source && source.uri) {
      const ok = await Image.prefetch(source.uri).catch(() => false);
      if (!ok) return toast(t('error.generic'), 'error');
    }
    if (locked && !storage.getBoolean(LOCKED_HINT_KEY)) {
      storage.set(LOCKED_HINT_KEY, true);
      toast(t('home.lockedHint'));
    }
    setFrame(item.id);
    router.back();
  }

  return (
    <ScrollView style={{ backgroundColor: colors.surface1 }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          {t('home.allFrames')}
        </Text>
        <IconButton
          testID="b4.close"
          accessibilityLabel={t('a11y.close')}
          onPress={() => router.back()}
          renderIcon={(c) => <XIcon size={24} color={c} />}
        />
      </View>
      <Segment
        testID="b4.tab"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'basics', label: t('home.tabBasics') },
          { value: 'season', label: t('home.tabSeason') },
          { value: 'owned', label: t('shop.owned') },
        ]}
      />
      {shown.length === 0 ? (
        <EmptyState
          testID="b4.empty"
          art={<SparkleIcon size={64} color={colors.inkMuted} />}
          title={tab === 'owned' ? t('home.ownedEmpty') : t('home.seasonEmpty')}
        />
      ) : (
        shown.map((pack) => (
          <View key={pack.id} style={styles.pack}>
            {shown.length > 1 && (
              <Text variant="bodySm" color="inkMuted">
                {pack.title[language]}
              </Text>
            )}
            <FrameGrid
              pack={pack}
              columns={isTablet ? 6 : 4}
              selectedId={frameId}
              onSelect={(item, locked) => void select(item, locked)}
              screenId="b4"
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space[4], gap: space[4], paddingBottom: space[8] },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
  pack: { gap: space[2] },
});
