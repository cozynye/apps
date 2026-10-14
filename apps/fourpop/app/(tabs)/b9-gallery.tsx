import { Screen, Text } from '@nf/ui';
import { useTranslation } from 'react-i18next';

// Tab shell only; the b9 screen content is built in the next S4 steps.
export default function GalleryScreen() {
  const { t } = useTranslation();
  return (
    <Screen edges={['top']}>
      <Text variant="displayLg" testID="b9.title">
        {t('tabs.gallery')}
      </Text>
    </Screen>
  );
}
