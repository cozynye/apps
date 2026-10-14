import { recordError } from '@nf/analytics';
import {
  Button,
  CameraRotateIcon,
  colors as palette,
  FlipHorizontalIcon,
  LightningIcon,
  LightningSlashIcon,
  PauseIcon,
  PlayIcon,
  radius,
  space,
  Text,
  useLayout,
  useToast,
  XIcon,
  type Icon,
} from '@nf/ui';
import { CameraView, type CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, AppState, Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession, SHOTS, clearSessionFiles, storeShot } from '../../src/session';
import { useBoothSettings } from '../../src/settings';
import { MOCK_CAMERA, startFromAlbum, storeMockShot } from '../../src/start';

/** Camera screens use the fixed dark palette in both themes (DESIGN_SYSTEM 촬영 화면 전용). */
const C = palette.light;
const TIMERS = [3, 5, 10] as const;
const VIEWFINDER_MAX = 600;
/** PLAN B5: countdown numerals 144px (the `countdown` token's style, larger). */
const COUNTDOWN_SIZE = 144;

type Phase = 'ready' | 'running' | 'paused';

/**
 * B5 capture: 8 shots on a countdown with a pose guide, then B6. `?retake=<i>` re-shoots one
 * shot and returns to B6. Background → pause; resume continues from the current shot.
 */
export default function CaptureScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { width } = useLayout();
  const params = useLocalSearchParams<{ retake?: string }>();
  const retake = params.retake !== undefined ? Number(params.retake) : null;
  const booth = useBoothSettings();
  const shots = useSession((s) => s.shots);

  const camera = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  // Native starts optimistic (the view must mount to probe lenses); web asks the API first.
  const [available, setAvailable] = useState<boolean | null>(MOCK_CAMERA || Platform.OS !== 'web' ? true : null);
  const [facing, setFacing] = useState<CameraType>('front');
  const [flash, setFlash] = useState(false);
  const [mirror, setMirror] = useState(booth.mirrorSelfie);
  const [timer, setTimer] = useState<(typeof TIMERS)[number]>(3);
  const [phase, setPhase] = useState<Phase>('ready');
  const [index, setIndex] = useState(retake ?? 0);
  const [count, setCount] = useState<number>(timer);
  const [capturing, setCapturing] = useState(false);
  const [flashOpacity] = useState(() => new Animated.Value(0));
  const [countScale] = useState(() => new Animated.Value(1));

  const total = retake !== null ? 1 : SHOTS;
  const taken = shots.filter(Boolean).length;
  const viewWidth = Math.min(width - space[4] * 2, VIEWFINDER_MAX);

  // Camera-less devices (PLAN 예외 › 카메라 없는 기기). `isAvailableAsync` exists on web only; on iOS
  // every device has a camera but the simulator finds no capture device and lists no lenses
  // (its `onCameraReady` still fires), so an empty lens list shortly after mount means "no camera".
  useEffect(() => {
    if (MOCK_CAMERA) return;
    if (Platform.OS === 'web') {
      CameraView.isAvailableAsync()
        .then(setAvailable)
        .catch(() => setAvailable(false));
      return;
    }
    const timer = setTimeout(() => {
      camera.current
        ?.getAvailableLensesAsync()
        .then((lenses) => lenses.length === 0 && setAvailable(false))
        .catch(() => undefined);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Leaving the app pauses the session; returning resumes from the current shot (PLAN B5).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') setPhase((p) => (p === 'running' ? 'paused' : p));
    });
    return () => sub.remove();
  }, []);

  const capture = useCallback(async () => {
    setCapturing(true);
    // White flash (120ms) + rigid haptic at zero (DESIGN_SYSTEM 모션·햅틱).
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
    ]).start();
    try {
      if (MOCK_CAMERA) await storeMockShot(index);
      else {
        const photo = await camera.current?.takePictureAsync({ quality: 0.9, shutterSound: booth.shutterSound });
        if (!photo) throw new Error('no photo');
        await storeShot(index, photo.uri, photo.width, photo.height);
      }
    } catch (error) {
      recordError(error as Error, 'capture');
      toast(t('error.generic'), 'error');
      setPhase('paused');
      setCapturing(false);
      return;
    }
    setCapturing(false);
    if (retake !== null) return router.back();
    if (index + 1 >= SHOTS) return router.replace('/booth/b6-pick');
    setIndex(index + 1);
    setCount(timer);
  }, [booth.shutterSound, flashOpacity, index, retake, t, timer, toast]);

  // One tick per second while running: light haptic, numeral scales in; at 0 the shot is taken.
  useEffect(() => {
    if (phase !== 'running' || capturing) return;
    if (count > 0) {
      countScale.setValue(1.2);
      Animated.timing(countScale, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // count 0 only remains after a failed capture; resuming then shoots right away.
    const id = setTimeout(
      () => {
        if (count > 1) return setCount(count - 1);
        setCount(0);
        void capture();
      },
      count > 0 ? 1000 : 0,
    );
    return () => clearTimeout(id);
  }, [phase, count, capturing, capture, countScale]);

  function toggleRun() {
    if (phase === 'ready') {
      setCount(timer);
      setPhase('running');
    } else setPhase(phase === 'running' ? 'paused' : 'running');
  }

  function close() {
    const done = () => {
      if (retake === null) clearSessionFiles();
      router.back();
    };
    if (retake !== null || taken === 0) return done();
    setPhase((p) => (p === 'running' ? 'paused' : p));
    Alert.alert(t('capture.stopConfirm', { count: taken }), undefined, [
      { text: t('action.cancel'), style: 'cancel' },
      { text: t('action.close'), style: 'destructive', onPress: done },
    ]);
  }

  const poses = t('capture.poses', { returnObjects: true }) as string[];
  // The pose guide shows for the first second of each shot (PLAN B5).
  const showPose = phase === 'running' && count === timer;

  if (available === false) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]} testID="b5.unavailable">
        <Text variant="body" align="center" style={{ color: C.cameraInk }}>
          {t('error.cameraUnavailable')}
        </Text>
        <Button
          testID="b5.fromAlbum"
          label={t('home.fromAlbum')}
          onPress={() => void startFromAlbum().then((ok) => ok || undefined)}
        />
        <Button testID="b5.close" variant="secondary" label={t('action.close')} onPress={() => router.back()} />
      </View>
    );
  }

  return (
    // Inset padding instead of the safe-area view: inside the fullScreenModal booth stack its insets
    // come back 0 on device (DECISIONS 2026-10-14, B7·B8).
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <ControlButton testID="b5.close" label={t('a11y.close')} Icon={XIcon} onPress={close} />
        <Text variant="bodyStrong" style={{ color: C.cameraInkMuted }} testID="b5.shotOf">
          {t('capture.shotOf', { current: retake !== null ? retake + 1 : index + 1, total: SHOTS })}
        </Text>
        <ControlButton
          testID="b5.flip"
          label={t('capture.flip')}
          Icon={CameraRotateIcon}
          onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
          disabled={phase === 'running'}
        />
      </View>

      <View style={[styles.viewfinder, { width: viewWidth, height: (viewWidth * 2) / 3 }]} testID="b5.viewfinder">
        {MOCK_CAMERA ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: C.cameraControl }]} />
        ) : (
          available && (
            <CameraView
              ref={camera}
              style={StyleSheet.absoluteFill}
              facing={facing}
              flash={flash ? 'on' : 'off'}
              mirror={facing === 'front' && mirror}
            />
          )
        )}
        {phase !== 'ready' && count > 0 && (
          <Animated.View style={[styles.center, StyleSheet.absoluteFill, { transform: [{ scale: countScale }] }]}>
            <Text variant="countdown" style={styles.countdown} testID="b5.countdown">
              {count}
            </Text>
          </Animated.View>
        )}
        {showPose && (
          <View style={[styles.pose, { backgroundColor: C.cameraSurface }]}>
            <Text variant="bodyStrong" style={{ color: C.cameraInk }} testID="b5.pose">
              {t('capture.pose', { name: poses[index % poses.length] })}
            </Text>
          </View>
        )}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.flash, { opacity: flashOpacity }]} />
      </View>

      <View style={[styles.dots, { width: viewWidth }]}>
        {shots.map((shot, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: C.cameraControl, borderColor: i === index && phase !== 'ready' ? C.fourpopPrimary : 'transparent' },
            ]}
          >
            {shot && <Image source={{ uri: shot.thumbUri }} style={StyleSheet.absoluteFill} />}
          </View>
        ))}
      </View>
      <Text variant="bodySm" align="center" style={{ color: C.cameraInkMuted }}>
        {t('capture.seconds', { count: timer })}
        {total === 1 ? ` · ${t('pick.retakeOne')}` : ''}
      </Text>

      <View style={styles.bottom}>
        {phase === 'ready' ? (
          <View style={styles.options}>
            <View style={styles.timers} accessibilityRole="radiogroup" accessibilityLabel={t('capture.timer')}>
              {TIMERS.map((s) => (
                <Pressable
                  key={s}
                  testID={`b5.timer.${s}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: timer === s }}
                  onPress={() => setTimer(s)}
                  style={[styles.timer, { backgroundColor: timer === s ? C.cameraInk : C.cameraControl }]}
                >
                  <Text variant="bodyStrong" style={{ color: timer === s ? C.cameraSurface : C.cameraInk }}>
                    {t('capture.seconds', { count: s })}
                  </Text>
                </Pressable>
              ))}
            </View>
            <ControlButton
              testID="b5.flash"
              label={flash ? t('capture.flashOn') : t('capture.flashOff')}
              Icon={flash ? LightningIcon : LightningSlashIcon}
              onPress={() => setFlash(!flash)}
            />
            <ControlButton
              testID="b5.mirror"
              label={t('capture.mirror')}
              Icon={FlipHorizontalIcon}
              active={mirror}
              onPress={() => setMirror(!mirror)}
            />
          </View>
        ) : null}
        <Pressable
          testID="b5.shutter"
          accessibilityRole="button"
          accessibilityLabel={phase === 'ready' ? t('capture.start') : phase === 'running' ? t('capture.pause') : t('capture.resume')}
          onPress={toggleRun}
          disabled={capturing}
          style={({ pressed }) => [styles.shutter, { backgroundColor: C.fourpopPrimary, opacity: pressed ? 0.85 : 1 }]}
        >
          {phase === 'running' ? (
            <PauseIcon size={32} color={C.onAccent} weight="fill" />
          ) : phase === 'paused' ? (
            <PlayIcon size={32} color={C.onAccent} weight="fill" />
          ) : (
            <Text variant="button" style={{ color: C.onAccent }}>
              {t('capture.start')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function ControlButton({
  label,
  Icon,
  onPress,
  disabled,
  active,
  testID,
}: {
  label: string;
  Icon: Icon;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.control, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }, active && { backgroundColor: C.cameraControl }]}
    >
      <Icon size={24} color={C.cameraInk} />
    </Pressable>
  );
}

const SHUTTER = 84;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.cameraSurface, alignItems: 'center', gap: space[4] },
  center: { alignItems: 'center', justifyContent: 'center', gap: space[4], padding: space[6] },
  topBar: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space[2] },
  viewfinder: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: C.cameraControl, borderWidth: 6, borderColor: C.cameraInk },
  countdown: { color: C.fourpopPrimary, fontSize: COUNTDOWN_SIZE, lineHeight: COUNTDOWN_SIZE },
  pose: { position: 'absolute', bottom: space[3], alignSelf: 'center', paddingHorizontal: space[4], paddingVertical: space[2], borderRadius: radius.pill },
  flash: { backgroundColor: C.cameraInk },
  dots: { flexDirection: 'row', gap: space[1] },
  dot: { flex: 1, aspectRatio: 3 / 2, borderRadius: radius.sm, overflow: 'hidden', borderWidth: 2 },
  bottom: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', gap: space[6], paddingBottom: space[6] },
  options: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  timers: { flexDirection: 'row', gap: space[1] },
  timer: { minHeight: 36, minWidth: 48, paddingHorizontal: space[3], borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  control: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: SHUTTER, height: SHUTTER, borderRadius: SHUTTER / 2, alignItems: 'center', justifyContent: 'center' },
});
