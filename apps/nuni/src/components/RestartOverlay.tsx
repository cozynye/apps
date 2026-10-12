import { Mascot, space, Text, useTheme } from '@nf/ui';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import { useRestartRequired } from '../backup';

/**
 * After an iCloud restore the database connection is closed and the files were replaced, so
 * nothing else may run: block the app until it is relaunched (PLAN 규칙 › iCloud 백업 › 재시작 안내).
 */
export function RestartOverlay() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const required = useRestartRequired((s) => s.required);
  if (!required) return null;
  return (
    <FullWindowOverlay>
      <View style={[styles.fill, { backgroundColor: colors.surface1 }]} testID="backup.restart">
        <Mascot mood={4} size={96} />
        <Text variant="title" align="center">
          {t('backup.restoredRestart')}
        </Text>
      </View>
    </FullWindowOverlay>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[4],
    padding: space[6],
  },
});
