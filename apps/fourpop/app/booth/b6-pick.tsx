import { Button, colors as palette, radius, space, Text } from '@nf/ui';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PICKS, resetSession, useSession } from '../../src/session';

const C = palette.light;

/**
 * B6: pick 4 of 8 (order = number badge). Long-press → retake that one shot (B5 ?retake=i).
 * "Retake all" asks first. Next → B7.
 */
export default function PickScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const shots = useSession((s) => s.shots);
  const picked = useSession((s) => s.picked);

  function toggle(i: number) {
    void Haptics.selectionAsync();
    const next = picked.includes(i) ? picked.filter((p) => p !== i) : picked.length < PICKS ? [...picked, i] : picked;
    useSession.setState({ picked: next });
  }

  function retakeAll() {
    Alert.alert(t('pick.retakeAll'), undefined, [
      { text: t('action.cancel'), style: 'cancel' },
      {
        text: t('pick.retakeAll'),
        style: 'destructive',
        onPress: () => {
          resetSession('camera');
          router.replace('/booth/b5-capture');
        },
      },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + space[4], paddingBottom: insets.bottom }]}>
      <Text variant="title" align="center" style={{ color: C.cameraInk }} testID="b6.title">
        {t('pick.title', { count: PICKS })}
      </Text>
      <Text variant="bodySm" align="center" style={{ color: C.cameraInkMuted }} testID="b6.picked">
        {t('pick.picked', { picked: picked.length, count: PICKS })}
      </Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {shots.map((shot, i) => {
          const order = picked.indexOf(i);
          return (
            <Pressable
              key={i}
              testID={`b6.shot.${i}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: order >= 0 }}
              accessibilityHint={t('pick.retakeOne')}
              onPress={() => toggle(i)}
              onLongPress={() => router.push({ pathname: '/booth/b5-capture', params: { retake: i } })}
              style={[styles.cell, { borderColor: order >= 0 ? C.fourpopPrimary : 'transparent' }]}
            >
              {shot && <Image source={{ uri: shot.thumbUri }} style={styles.image} />}
              {order >= 0 && (
                <View style={[styles.badge, { backgroundColor: C.fourpopPrimary }]}>
                  <Text variant="bodyStrong" style={{ color: C.onAccent }}>
                    {order + 1}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={styles.bottom}>
        <Button
          testID="b6.next"
          label={t('action.continue')}
          disabled={picked.length < PICKS}
          onPress={() => router.push('/booth/b7-decorate')}
        />
        <Pressable testID="b6.retakeAll" accessibilityRole="button" onPress={retakeAll} hitSlop={space[3]}>
          <Text variant="bodySm" align="center" style={{ color: C.cameraInkMuted }}>
            {t('pick.retakeAll')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cameraSurface, gap: space[2] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: space[3], gap: space[3], justifyContent: 'center' },
  cell: { width: '46%', maxWidth: 280, aspectRatio: 3 / 2, borderRadius: radius.md, borderWidth: 3, overflow: 'hidden', backgroundColor: C.cameraControl },
  image: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: space[2], left: space[2], width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bottom: { padding: space[4], gap: space[4] },
});
