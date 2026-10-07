import { Button, Screen, space } from '@nf/ui';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

// Developer menu: labels are dev-only (not user-visible in production builds).
export default function DevMenu() {
  return (
    <Screen>
      <View style={styles.stack}>
        <Button testID="dev.stories" label="Component stories" onPress={() => router.push('/dev/stories')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ stack: { gap: space[3], paddingVertical: space[6] } });
