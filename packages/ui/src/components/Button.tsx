import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { radius, space } from '../generated/tokens';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  icon?: React.ReactNode;
  testID: string;
}

/** Labels may wrap to two lines (vi is 20–30% longer); never truncated. */
export function Button({
  label,
  variant = 'primary',
  disabled,
  loading,
  icon,
  ...rest
}: ButtonProps) {
  const { colors, accent } = useTheme();
  const inactive = disabled || loading;
  const primary = variant === 'primary';
  const background = inactive && primary ? colors.surface2 : primary ? accent.primary : colors.surface0;
  // Text on pastel accents is always on-accent (DESIGN_SYSTEM 원칙 3).
  const labelColor = inactive ? 'inkDisabled' : primary ? 'onAccent' : 'ink';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      {...rest}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background, opacity: pressed ? 0.85 : 1 },
        !primary && { borderWidth: 1, borderColor: colors.line },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.inkDisabled} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text variant="button" color={labelColor} align="center" style={styles.label}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: space[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  label: { flexShrink: 1 },
});
