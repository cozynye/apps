import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { layout, radius, space } from '../generated/tokens';
import { CaretRightIcon } from '../icons';
import { useTheme } from '../theme';
import { PressableSurface } from './PressableSurface';
import { Text } from './Text';

/** A titled group of rows on a card (section label: body-sm, sentence case — no uppercase). */
export function SettingsSection({ title, children, testID }: { title?: string; children: ReactNode; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section} testID={testID}>
      {title ? (
        <Text variant="bodySm" color="inkMuted" style={styles.sectionTitle}>
          {title}
        </Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: colors.surface0, borderColor: colors.line }]}>
        {Children.toArray(children).map((child, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.line }]} />}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

export interface SettingsRowProps {
  label: string;
  /** Secondary line under the label (hints, notices). */
  hint?: string;
  /** Right-side value text (e.g. the current language). */
  value?: string;
  /** Right-side control (Switch, picker) instead of the chevron. */
  accessory?: ReactNode;
  destructive?: boolean;
  onPress?: () => void;
  testID: string;
}

/** One settings row: 44pt+ touch height, chevron when it navigates, accessory for inline controls. */
export function SettingsRow({ label, hint, value, accessory, destructive, onPress, testID }: SettingsRowProps) {
  const { colors } = useTheme();
  const content = (
    <>
      <View style={styles.text}>
        <Text variant="body" color={destructive ? 'statusError' : 'ink'}>
          {label}
        </Text>
        {hint ? (
          <Text variant="bodySm" color="inkMuted">
            {hint}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="bodySm" color="inkMuted" style={styles.value}>
          {value}
        </Text>
      ) : null}
      {accessory ?? (onPress && !destructive ? <CaretRightIcon size={18} color={colors.inkMuted} /> : null)}
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.row} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <PressableSurface
      testID={testID}
      accessibilityLabel={[label, value].filter(Boolean).join(', ')}
      onPress={onPress}
      style={styles.row}
    >
      {content}
    </PressableSurface>
  );
}

const styles = StyleSheet.create({
  section: { gap: space[2] },
  sectionTitle: { paddingHorizontal: space[1] },
  card: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: space[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: layout.touchMin + space[2],
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
  text: { flex: 1, gap: space[1] },
  value: { flexShrink: 1, textAlign: 'right' },
});
