import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

import { radius, space } from '../generated/tokens';
import { useTheme } from '../theme';
import { useTypography } from '../typography';

/** Bundled Markdown (terms, privacy, licenses) styled with design tokens. */
export function MarkdownDocument({ markdown }: { markdown: string }) {
  const { colors } = useTheme();
  const type = useTypography();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: { ...type.body, color: colors.ink },
        heading1: { ...type.displayLg, color: colors.ink, marginTop: space[6], marginBottom: space[3] },
        heading2: { ...type.title, color: colors.ink, marginTop: space[6], marginBottom: space[2] },
        heading3: { ...type.bodyStrong, color: colors.ink, marginTop: space[4] },
        strong: { fontFamily: type.bodyStrong.fontFamily },
        link: { color: colors.ink, textDecorationLine: 'underline' },
        bullet_list: { marginVertical: space[2] },
        code_block: {
          ...type.caption,
          color: colors.inkMuted,
          backgroundColor: colors.surface2,
          borderWidth: 0,
          borderRadius: radius.sm,
          padding: space[3],
        },
        fence: {
          ...type.caption,
          color: colors.inkMuted,
          backgroundColor: colors.surface2,
          borderWidth: 0,
          borderRadius: radius.sm,
          padding: space[3],
        },
        hr: { backgroundColor: colors.line },
      }),
    [colors, type],
  );
  return <Markdown style={styles}>{markdown}</Markdown>;
}
