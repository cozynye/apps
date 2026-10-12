import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout, space } from '../generated/tokens';
import type { Icon } from '../icons';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface TabBarItem {
  name: string;
  label: string;
  Icon: Icon;
  testID: string;
}

export interface TabBarProps {
  items: TabBarItem[];
  activeName: string;
  onSelect: (name: string) => void;
}

/** Items stay grouped in the middle on iPad (PLAN iPad 대응 › 탭 바). */
const MAX_ITEMS_WIDTH = 480;

/** Bottom tab bar: surface-0, top `line`, active label in the app's deep color, inactive ink-muted. */
export function TabBar({ items, activeName, onSelect }: TabBarProps) {
  const { colors, accent } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        { backgroundColor: colors.surface0, borderTopColor: colors.line, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.items}>
        {items.map(({ name, label, Icon, testID }) => {
          const active = name === activeName;
          const color = active ? accent.deep : colors.inkMuted;
          return (
            <Pressable
              key={name}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              testID={testID}
              onPress={() => onSelect(name)}
              style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surface2 }]}
            >
              <Icon size={24} color={color} weight="regular" />
              <Text variant="caption" style={{ color }} align="center">
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth },
  items: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: MAX_ITEMS_WIDTH,
    alignSelf: 'center',
  },
  item: {
    flex: 1,
    minHeight: layout.touchMin + space[2],
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
    paddingVertical: space[2],
  },
});
