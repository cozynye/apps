import { SvgXml } from 'react-native-svg';

import { svgs, type SvgName } from '../generated/svgs';
import { useTheme } from '../theme';

export type Mood = 1 | 2 | 3 | 4 | 5;

/** Above this size the decorated variant is used; at or below, the plain `-sm` face. */
const SMALL_MAX = 40;

export interface MascotProps {
  mood: Mood;
  size: number;
  accessibilityLabel?: string;
}

export function Mascot({ mood, size, accessibilityLabel }: MascotProps) {
  const { colors } = useTheme();
  const name: SvgName = size <= SMALL_MAX ? `nuni-mood-${mood}-sm` : `nuni-mood-${mood}`;
  return (
    <SvgXml
      xml={svgs[name](colors)}
      width={size}
      height={size}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export type IllustrationName = Extract<SvgName, `${string}-onboarding-${number}`>;

/** Onboarding art (1024×768, 4:3). Width drives height. */
export function Illustration({ name, width }: { name: IllustrationName; width: number }) {
  const { colors } = useTheme();
  return <SvgXml xml={svgs[name](colors)} width={width} height={(width * 3) / 4} />;
}
