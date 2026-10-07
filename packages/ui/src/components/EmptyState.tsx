import { StyleSheet, View } from 'react-native';

import { space } from '../generated/tokens';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  /** 120pt mascot (Nuni) or strip illustration (Fourpop). */
  art: React.ReactNode;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  testID: string;
}

export function EmptyState({ art, title, body, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <View style={styles.root} testID={testID}>
      {art}
      <Text variant="title" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="bodySm" color="inkMuted" align="center">
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} testID={`${testID}.action`} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
    paddingHorizontal: space[4],
    paddingVertical: space[12],
  },
  action: { marginTop: space[4], alignSelf: 'stretch', maxWidth: 320, width: '100%' },
});
