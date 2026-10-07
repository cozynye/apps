import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import type { ColorName, TypographyName } from '../generated/tokens';
import { useTheme } from '../theme';
import { useTypography } from '../typography';

/** Dynamic Type is supported up to AX1 (PLAN 예외 상황 › Dynamic Type). */
export const MAX_FONT_SCALE = 1.65;

export interface TextProps extends RNTextProps {
  variant?: TypographyName;
  color?: ColorName;
  align?: 'left' | 'center' | 'right';
}

export function Text({ variant = 'body', color = 'ink', align, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  const type = useTypography();
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[type[variant], { color: colors[color] }, align && { textAlign: align }, style]}
    />
  );
}
