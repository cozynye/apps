import { refreshCustomerInfo, restorePurchases, useEntitlement, useEntitlementStore } from '@nf/purchases';
import { Button, Card, Screen, space, Text, useToast } from '@nf/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

// Dev-only: entitlement state for StoreKit / RevenueCat Test Store checks.
export default function DevPurchases() {
  const toast = useToast();
  const enabled = useEntitlementStore((s) => s.enabled);
  const live = useEntitlementStore((s) => s.live);
  const mirror = useEntitlementStore((s) => s.mirror);
  const premium = useEntitlement('mood_premium');

  return (
    <Screen scroll>
      <View style={styles.stack}>
        <Card testID="dev.purchases.state">
          <Text testID="dev.purchases.premium">{`mood_premium: ${premium ? 'active' : 'locked'}`}</Text>
          <Text variant="bodySm" color="inkMuted">{`configured: ${enabled} · live: ${live}`}</Text>
          <Text variant="caption" color="inkMuted">{JSON.stringify(mirror)}</Text>
        </Card>
        <Button testID="dev.purchases.paywall" label="Open paywall (A9)" onPress={() => router.push('/a9-paywall?source=settings')} />
        <Button
          testID="dev.purchases.restore"
          variant="secondary"
          label="Restore purchases"
          onPress={async () => toast(`restore: ${await restorePurchases()}`)}
        />
        <Button
          testID="dev.purchases.refresh"
          variant="secondary"
          label="Refresh CustomerInfo"
          onPress={async () => toast((await refreshCustomerInfo()) ? 'refreshed' : 'failed')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ stack: { gap: space[3], paddingVertical: space[6] } });
