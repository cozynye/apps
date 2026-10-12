import { Pressable, StyleSheet } from 'react-native';

import { layout } from '../generated/tokens';
import { useTheme } from '../theme';

export interface IconButtonProps {
  /** Required: icon-only buttons need a VoiceOver label (PLAN 완료 기준 › 접근성). */
  accessibilityLabel: string;
  renderIcon: (color: string) => React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  testID: string;
}

/** 44×44 touch box around a 24px line icon. */
export function IconButton({ accessibilityLabel, renderIcon, onPress, disabled, testID }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.box, { opacity: pressed ? 0.85 : 1 }]}
    >
      {renderIcon(disabled ? colors.inkDisabled : colors.ink)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: layout.touchMin,
    height: layout.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
