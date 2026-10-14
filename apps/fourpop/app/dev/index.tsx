import { Button, Screen, space, Text } from '@nf/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useCatalog } from '../../src/catalog';
import { installPack, useInstalls } from '../../src/packs';

// Developer menu: labels are dev-only (not user-visible in production builds).
// `fourpop:///dev` — installs CDN packs without a purchase so the download path can be exercised
// against the mock CDN (`pnpm cdn:mock`) before the RevenueCat key exists.
export default function DevMenu() {
  const { packs, offline, manifestVersion, installedIds } = useCatalog();
  const installs = useInstalls();
  const remote = packs.filter((p) => !p.bundled);
  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Text variant="title">Dev</Text>
        <Text variant="bodySm" color="inkMuted" testID="dev.catalog">
          {`manifest v${manifestVersion} · ${packs.length} packs · ${offline ? 'offline' : 'online'}`}
        </Text>
        {remote.map((pack) => {
          const state = installs[pack.id];
          const label =
            state?.status === 'downloading' ? `${pack.id}: ${state.done}/${state.total}` : `${pack.id}: ${state?.status ?? (installedIds.has(pack.id) ? 'installed' : 'not installed')}`;
          return (
            <View key={pack.id} style={styles.row}>
              <Text variant="body" testID={`dev.pack.${pack.id}`}>
                {label}
              </Text>
              <Button
                testID={`dev.install.${pack.id}`}
                variant="secondary"
                label="Install (no purchase)"
                loading={state?.status === 'downloading'}
                onPress={() => void installPack(pack).catch(() => undefined)}
              />
            </View>
          );
        })}
        <Button testID="dev.home" variant="secondary" label="Home (B3)" onPress={() => router.replace('/b3-home')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ stack: { gap: space[3], paddingVertical: space[6] }, row: { gap: space[2] } });
