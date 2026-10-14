import { Screen, Text } from '@nf/ui';
import { useTranslation } from 'react-i18next';

// Tab shell only; the b10 screen content is built in the next S4 steps.
export default function ShopScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']}>
      <Text variant="displayLg" testID="b10.title">
        {t('tabs.shop')}
      </Text>
    </Screen>
  );
}
