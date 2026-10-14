import { licensesEn, privacyEn, termsEn } from '@nf/content';
import { IconButton, MarkdownDocument, Screen, space, Text, XIcon } from '@nf/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

const DOCS = {
  terms: { titleKey: 'legal.termsTitle', markdown: termsEn },
  privacy: { titleKey: 'legal.privacyTitle', markdown: privacyEn },
  licenses: { titleKey: 'settings.licenses', markdown: licensesEn },
} as const;

/** B13 Terms / Privacy / Licenses: bundled English Markdown (MVP). */
export default function LegalScreen() {
  const { t } = useTranslation();
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const entry = DOCS[doc as keyof typeof DOCS] ?? DOCS.terms;

  return (
    <Screen scroll testID="b13.root">
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          {t(entry.titleKey)}
        </Text>
        <IconButton
          testID="b13.close"
          accessibilityLabel={t('a11y.close')}
          onPress={() => router.back()}
          renderIcon={(c) => <XIcon size={24} color={c} />}
        />
      </View>
      <Text variant="bodySm" color="inkMuted">
        {t('legal.englishOnly')}
      </Text>
      <MarkdownDocument markdown={entry.markdown} />
      <View style={styles.bottom} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: space[2] },
  title: { flex: 1 },
  bottom: { height: space[8] },
});
