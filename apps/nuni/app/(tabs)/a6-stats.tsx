import { Screen, Text } from '@nf/ui';
import { useTranslation } from 'react-i18next';

// Tab shell only; the a6 screen content is built in the next S2 steps.
export default function StatsScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']}>
      <Text variant="displayLg" testID="a6.title">
        {t('tabs.stats')}
      </Text>
    </Screen>
  );
}
