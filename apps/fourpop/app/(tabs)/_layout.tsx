import { useTheme } from '@nf/ui';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

/**
 * Three tabs: B3 booth, B9 gallery, B10 shop (settings: header gear → B12). Native tab bar like
 * Nuni (Cozy 2026-10-13, iOS 26 Liquid Glass).
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const { accent } = useTheme();
  return (
    <NativeTabs tintColor={accent.deep}>
      <NativeTabs.Trigger name="b3-home" testID="tabs.booth">
        <NativeTabs.Trigger.Icon sf="camera" />
        <NativeTabs.Trigger.Label>{t('tabs.booth')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="b9-gallery" testID="tabs.gallery">
        <NativeTabs.Trigger.Icon sf="photo.on.rectangle" />
        <NativeTabs.Trigger.Label>{t('tabs.gallery')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="b10-shop" testID="tabs.shop">
        <NativeTabs.Trigger.Icon sf="bag" />
        <NativeTabs.Trigger.Label>{t('tabs.shop')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
