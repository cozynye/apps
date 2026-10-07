import { Button, Screen, space } from '@nf/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

// Developer menu: labels are dev-only (not user-visible in production builds).
export default function DevMenu() {
  return (
    <Screen>
      <View style={styles.stack}>
        <Button testID="dev.stories" label="Component stories" onPress={() => router.push('/dev/stories')} />
        <Button testID="dev.purchases" label="Purchases" onPress={() => router.push('/dev/purchases')} />
        <Button testID="dev.data" label="DB & content" onPress={() => router.push('/dev/data')} />
        <Button testID="dev.legal" variant="secondary" label="Licenses (A13)" onPress={() => router.push('/a13-legal/licenses')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ stack: { gap: space[3], paddingVertical: space[6] } });
