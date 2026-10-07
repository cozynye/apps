import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export interface PressableSurfaceProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  testID: string;
}

/** Cards and cells: pressed state turns the background surface-2. */
export function PressableSurface({ style, ...rest }: PressableSurfaceProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [style, pressed && { backgroundColor: colors.surface2 }]}
    />
  );
}
