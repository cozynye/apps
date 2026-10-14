import { Screen, Text } from '@nf/ui';
import { useTranslation } from 'react-i18next';

// Tab shell only; the b3 screen content is built in the next S4 steps.
export default function BoothScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']}>
      <Text variant="displayLg" testID="b3.title">
        {t('app.name')}
      </Text>
    </Screen>
  );
}
