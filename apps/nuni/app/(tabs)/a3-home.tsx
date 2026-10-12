import { Screen, Text } from '@nf/ui';
import { useTranslation } from 'react-i18next';

// Tab shell only; the a3 screen content is built in the next S2 steps.
export default function HomeScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']}>
      <Text variant="displayLg" testID="a3.title">
        {t('tabs.home')}
      </Text>
    </Screen>
  );
}
