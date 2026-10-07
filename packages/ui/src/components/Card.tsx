import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, space } from '../generated/tokens';
import { useTheme } from '../theme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors } = useTheme();
  return (
    <View
      {...rest}
      style={[styles.card, { backgroundColor: colors.surface0, borderColor: colors.line }, style]}
    />
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.md, padding: space[4] },
});
