import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space } from '../generated/tokens';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  testID: string;
}

/** Visual height 36; hitSlop fills the 44pt touch target. */
export function Chip({ label, selected, onPress, icon, testID }: ChipProps) {
  const { colors, accent } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      hitSlop={{ top: 4, bottom: 4 }}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? accent.soft : colors.surface2, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.row}>
        {icon}
        <Text variant={selected ? 'bodyStrong' : 'body'} style={{ color: selected ? accent.deep : colors.ink }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    borderRadius: radius.pill,
    paddingHorizontal: space[3],
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[1] },
});
