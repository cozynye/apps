import { Pressable, StyleSheet, View } from 'react-native';

import { radius, space } from '../generated/tokens';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface PlanCardProps {
  title: string;
  subtitle?: string;
  trailing?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}

/** Paywall plan option. Border is always 2px so selection never shifts layout. */
export function PlanCard({ title, subtitle, trailing, badge, selected, onPress, testID }: PlanCardProps) {
  const { colors, accent } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      testID={testID}
      style={[
        styles.card,
        {
          borderColor: selected ? accent.primary : colors.line,
          backgroundColor: selected ? accent.soft : colors.surface0,
        },
      ]}
    >
      <View style={styles.main}>
        <Text variant="title">{title}</Text>
        {subtitle ? (
          <Text variant="bodySm" color="inkMuted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.side}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: accent.deep }]}>
            <Text variant="caption" color="surface0">
              {badge}
            </Text>
          </View>
        ) : null}
        {trailing ? (
          <Text variant="bodySm" color="inkMuted">
            {trailing}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: radius.lg,
    padding: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
  },
  main: { flex: 1, gap: space[1] },
  side: { alignItems: 'flex-end', gap: space[1] },
  badge: { borderRadius: radius.pill, paddingHorizontal: space[2], paddingVertical: 2 },
});
