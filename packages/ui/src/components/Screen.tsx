import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { layout, space } from '../generated/tokens';
import { useLayout } from '../layout';
import { useTheme } from '../theme';

export interface ScreenProps extends ViewProps {
  scroll?: boolean;
  /** Nuni centers content at `layout-max-content` (600) on iPad. */
  maxWidth?: number;
  edges?: Edge[];
}

/** Screen root: surface-1 background, safe area, side gutter, centered max width on tablet. */
export function Screen({ scroll, maxWidth = layout.layoutMaxContent, edges, style, children, ...rest }: ScreenProps) {
  const { colors } = useTheme();
  const { isTablet } = useLayout();
  // Without `scroll`, the content fills the screen exactly so an inner ScrollView gets a bounded
  // height and can scroll (tab screens at large Dynamic Type).
  const content = (
    <View
      {...rest}
      style={[
        styles.content,
        !scroll && styles.fill,
        isTablet && { maxWidth, alignSelf: 'center', width: '100%' },
        style,
      ]}
    >
      {children}
    </View>
  );
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.surface1 }]}>
      {scroll ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: space[4] },
  fill: { flex: 1 },
});
