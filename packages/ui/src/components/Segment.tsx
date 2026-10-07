import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space } from '../generated/tokens';
import { LockSimpleIcon } from '../icons';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Locked options stay tappable (the caller opens the paywall) and show a lock icon. */
  locked?: boolean;
}

export interface SegmentProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testID: string;
}

export function Segment<T extends string>({ options, value, onChange, testID }: SegmentProps<T>) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      testID={testID}
      style={[styles.track, { backgroundColor: colors.surface2 }]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            hitSlop={{ top: 4, bottom: 4 }}
            onPress={() => onChange(option.value)}
            testID={`${testID}.${option.value}`}
            style={[styles.item, active && { backgroundColor: colors.surface0 }]}
          >
            <Text variant={active ? 'bodyStrong' : 'body'} color={active ? 'ink' : 'inkMuted'}>
              {option.label}
            </Text>
            {option.locked ? <LockSimpleIcon size={14} color={colors.inkMuted} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    padding: 2,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  item: {
    flexShrink: 1,
    minHeight: 36,
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
  },
});
