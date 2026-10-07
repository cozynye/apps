import { useWindowDimensions } from 'react-native';

import { layout } from './generated/tokens';

/** Window-width breakpoints (PLAN iPad 대응). Never decide by device type. */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isTablet: width >= layout.breakpointTablet,
    /** 1024pt+: Nuni two-column calendar layout. */
    isWide: width >= 1024,
    isLandscape: width > height,
  };
}
