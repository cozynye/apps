import { Screen, Text } from '@nf/ui';
import { useTranslation } from 'react-i18next';

// Tab shell only; the a10 screen content is built in the next S2 steps.
export default function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']}>
      <Text variant="displayLg" testID="a10.title">
        {t('tabs.settings')}
      </Text>
    </Screen>
  );
}
