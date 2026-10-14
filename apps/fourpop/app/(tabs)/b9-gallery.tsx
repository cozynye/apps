import type { Strip } from '@nf/db/fourpop';
import { formatWeekdayDayMonth, fromLocalDateString, intlLocale, isLanguage, type Language } from '@nf/i18n';
import { EmptyState, ImageIcon, PressableSurface, radius, Screen, space, Text, useTheme, useToast } from '@nf/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';

import { findFrame, useCatalog } from '../../src/catalog';
import { deleteStrip, stripUri } from '../../src/compose';
import { useStripGroups } from '../../src/gallery';

const DELETE_WIDTH = 88;

/** B9 gallery: strips by day, tap → B8 (share again), swipe left → delete (PLAN B9). */
export default function GalleryScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const groups = useStripGroups();
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  let index = 0;

  return (
    <Screen edges={['top']}>
      <Text variant="displayLg" testID="b9.title" style={styles.title}>
        {t('gallery.title')}
      </Text>
      {groups.length === 0 ? (
        <EmptyState
          testID="b9.empty"
          art={<ImageIcon size={64} color={colors.inkMuted} />}
          title={t('gallery.empty')}
          actionLabel={t('gallery.emptyCta')}
          onAction={() => router.navigate('/b3-home')}
        />
      ) : (
        // `automatic` keeps the last rows above the floating native tab bar (iPad: top tabs).
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
          {groups.map((group) => (
            <View key={group.date} style={styles.group}>
              <Text variant="bodySm" color="inkMuted" testID={`b9.day.${group.date}`}>
                {formatWeekdayDayMonth(language, fromLocalDateString(group.date))}
              </Text>
              {group.strips.map((strip) => (
                <StripRow key={strip.id} strip={strip} language={language} index={index++} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

/** Swipe left to reveal Delete (horizontal ScrollView, like Nuni A5); VoiceOver gets a custom action. */
function StripRow({ strip, language, index }: { strip: Strip; language: Language; index: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const toast = useToast();
  const packs = useCatalog((s) => s.packs);
  const [rowWidth, setRowWidth] = useState(0);
  const frameName = findFrame(packs, strip.frameId)?.item.title[language] ?? strip.frameId;
  const filterName = t(`decorate.filters.${strip.filter}`, { defaultValue: strip.filter });
  const time = new Intl.DateTimeFormat(intlLocale(language), { hour: 'numeric', minute: '2-digit' }).format(strip.createdAt);

  function confirmDelete() {
    Alert.alert(t('gallery.deleteConfirm'), undefined, [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('action.delete'),
        style: 'destructive',
        onPress: () => void deleteStrip(strip.id).catch(() => toast(t('error.generic'), 'error')),
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
        testID={`b9.row.${index}`}
      >
        <PressableSurface
          testID={`b9.strip.${index}`}
          accessibilityLabel={[frameName, time, filterName].join(', ')}
          accessibilityActions={[{ name: 'delete', label: t('action.delete') }]}
          onAccessibilityAction={(e) => e.nativeEvent.actionName === 'delete' && confirmDelete()}
          onPress={() => router.push({ pathname: '/booth/b8-result', params: { stripId: strip.id } })}
          style={[styles.row, { width: rowWidth, borderColor: colors.line, backgroundColor: colors.surface0 }]}
        >
          <Image source={{ uri: stripUri(strip.thumbName) }} style={[styles.thumb, { backgroundColor: colors.surface2 }]} resizeMode="cover" />
          <View style={styles.rowText}>
            <Text variant="bodyStrong">{frameName}</Text>
            <Text variant="bodySm" color="inkMuted">
              {`${time} · ${filterName}`}
            </Text>
          </View>
        </PressableSurface>
        <PressableSurface
          testID={`b9.delete.${index}`}
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
  title: { paddingTop: space[2] },
  content: { gap: space[5], paddingTop: space[4], paddingBottom: space[8] },
  group: { gap: space[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3], padding: space[3], borderWidth: 1, borderRadius: radius.md },
  thumb: { width: 56, height: 168, borderRadius: radius.sm },
  rowText: { flex: 1, gap: space[1] },
  delete: { width: DELETE_WIDTH - space[2], marginLeft: space[2], borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
