import { Button, Mascot, space, Text, useTheme } from '@nf/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

/** Shown once when the streak first reaches 3 days. No paywall here (PLAN 사용자 플로우 4). */
export default function StreakCelebrate() {
  const { count } = useLocalSearchParams<{ count: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <ScrollView style={{ backgroundColor: colors.surface0 }} contentContainerStyle={styles.content}>
      <Mascot mood={5} size={96} />
      <View style={styles.copy}>
        <Text variant="title" align="center" testID="streak.title">
          {t('streak.celebrateTitle', { count: Number(count) })}
        </Text>
        <Text variant="body" color="inkMuted" align="center">
          {t('streak.celebrateBody')}
        </Text>
      </View>
      <View style={styles.buttons}>
        <Button
          testID="streak.seePatterns"
          label={t('streak.seePatterns')}
          onPress={() => {
            router.back();
            router.navigate('/a6-stats');
          }}
        />
        <Button testID="streak.close" variant="secondary" label={t('action.close')} onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space[6], gap: space[5], alignItems: 'center' },
  copy: { gap: space[2], maxWidth: 360 },
  buttons: { alignSelf: 'stretch', gap: space[3] },
});
