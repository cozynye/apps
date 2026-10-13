import { BackspaceIcon, PressableSurface, radius, space, Text, useTheme } from '@nf/ui';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PASSCODE_LENGTH } from '../lock';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;
const KEY = 72;

export interface PasscodePadProps {
  value: string;
  onChange: (value: string) => void;
  /** testID prefix: `a11` on the lock screen, `lock` in settings. */
  screenId: string;
}

/** Four dots + a 3×4 keypad. Digits are never shown; the caller acts when the 4th digit is entered. */
export function PasscodePad({ value, onChange, screenId }: PasscodePadProps) {
  const { t } = useTranslation();
  const { colors, accent } = useTheme();
  return (
    <View style={styles.root}>
      <View
        style={styles.dots}
        accessible
        accessibilityLabel={t('lock.passcode')}
        accessibilityValue={{ min: 0, max: PASSCODE_LENGTH, now: value.length }}
      >
        {Array.from({ length: PASSCODE_LENGTH }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { borderColor: colors.inkMuted },
              i < value.length && { backgroundColor: accent.deep, borderColor: accent.deep },
            ]}
          />
        ))}
      </View>
      <View style={styles.grid}>
        {KEYS.map((key, i) =>
          key === '' ? (
            <View key={i} style={styles.key} />
          ) : (
            <PressableSurface
              key={i}
              testID={`${screenId}.key.${key}`}
              accessibilityLabel={key === 'del' ? t('action.delete') : key}
              onPress={() => {
                if (key === 'del') onChange(value.slice(0, -1));
                else if (value.length < PASSCODE_LENGTH) onChange(value + key);
              }}
              style={[styles.key, { backgroundColor: key === 'del' ? 'transparent' : colors.surface0 }]}
            >
              {key === 'del' ? <BackspaceIcon size={24} color={colors.ink} /> : <Text variant="title">{key}</Text>}
            </PressableSurface>
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space[8] },
  dots: { flexDirection: 'row', gap: space[4] },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  grid: { width: KEY * 3 + space[5] * 2, flexDirection: 'row', flexWrap: 'wrap', gap: space[5] },
  key: { width: KEY, height: KEY, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
