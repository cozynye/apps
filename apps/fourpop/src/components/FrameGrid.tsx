import type { FrameItem, FramePack } from '@nf/content';
import { isLanguage } from '@nf/i18n';
import { LockSimpleIcon, PressableSurface, radius, space, Text, useTheme } from '@nf/ui';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, View } from 'react-native';

import { imageSource, useCanUse } from '../catalog';

export interface FrameGridProps {
  pack: FramePack;
  items?: FrameItem[];
  columns: number;
  selectedId: string;
  onSelect: (item: FrameItem, locked: boolean) => void;
  /** testID prefix: `b3` on home, `b4` in the frame sheet. */
  screenId: string;
}

/** Frame thumbnails (200×600 → 1:3) with names; locked frames show a lock but stay selectable. */
export function FrameGrid({ pack, items = pack.items, columns, selectedId, onSelect, screenId }: FrameGridProps) {
  const canUse = useCanUse(pack);
  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <FrameCell
          key={item.id}
          item={item}
          locked={!canUse}
          selected={item.id === selectedId}
          width={`${100 / columns}%`}
          onPress={() => onSelect(item, !canUse)}
          testID={`${screenId}.frame.${item.id}`}
        />
      ))}
    </View>
  );
}

function FrameCell({
  item,
  locked,
  selected,
  width,
  onPress,
  testID,
}: {
  item: FrameItem;
  locked: boolean;
  selected: boolean;
  width: `${number}%`;
  onPress: () => void;
  testID: string;
}) {
  const { i18n } = useTranslation();
  const { colors, accent } = useTheme();
  const language = isLanguage(i18n.language) ? i18n.language : 'en';
  const name = item.title[language];
  return (
    <View style={[styles.cellWrap, { width }]}>
      <PressableSurface
        testID={testID}
        accessibilityLabel={name}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={[
          styles.cell,
          { backgroundColor: colors.surface0, borderColor: selected ? accent.primary : colors.line },
          selected && styles.cellSelected,
        ]}
      >
        <Image source={imageSource(item.thumbnail)} style={styles.thumb} resizeMode="contain" />
        {/* 5–8 narrow columns: cap the caption's Dynamic Type growth so names do not break mid-word at AX1. */}
        <Text variant="caption" align="center" numberOfLines={2} maxFontSizeMultiplier={1.3} style={{ color: selected ? accent.deep : colors.inkMuted }}>
          {name}
        </Text>
        {locked && (
          <View style={[styles.lock, { backgroundColor: colors.surface0 }]}>
            <LockSimpleIcon size={14} color={colors.ink} />
          </View>
        )}
      </PressableSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -space[1] },
  cellWrap: { padding: space[1] },
  cell: { alignItems: 'center', gap: space[1], paddingVertical: space[2], borderWidth: 1, borderRadius: radius.md },
  cellSelected: { borderWidth: 2 },
  // Bundled (require) images carry their pixel size as a default height; clear it so aspectRatio wins.
  thumb: { width: '62%', height: undefined, aspectRatio: 1 / 3 },
  lock: { position: 'absolute', top: space[1], right: space[1], borderRadius: radius.pill, padding: 3 },
});
