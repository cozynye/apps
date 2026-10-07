import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { motion, radius, space } from '../generated/tokens';
import { useTheme } from '../theme';
import { Text } from './Text';

export type ToastTone = 'default' | 'success' | 'error';

interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

const DURATION_MS = 2500;
const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);
  const show = useCallback((message: string, tone: ToastTone = 'default') => {
    nextId.current += 1;
    setToast({ id: nextId.current, message, tone });
    AccessibilityInfo.announceForAccessibility(message);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        // FullWindowOverlay keeps toasts above native modals (paywall, sheets).
        <FullWindowOverlay>
          <ToastView key={toast.id} toast={toast} onDone={() => setToast(null)} />
        </FullWindowOverlay>
      ) : null}
    </ToastContext.Provider>
  );
}

function ToastView({ toast, onDone }: { toast: ToastState; onDone: () => void }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const show = Animated.timing(progress, { toValue: 1, duration: motion.durationBase, useNativeDriver: true });
    const hide = Animated.timing(progress, { toValue: 0, duration: motion.durationBase, useNativeDriver: true });
    show.start();
    const timer = setTimeout(() => hide.start(({ finished }) => finished && onDone()), DURATION_MS);
    return () => clearTimeout(timer);
  }, [progress, onDone]);

  const border = useMemo(
    () =>
      toast.tone === 'success' ? colors.statusSuccess : toast.tone === 'error' ? colors.statusError : colors.ink,
    [toast.tone, colors],
  );
  // Slide up 8pt + fade; fade only when Reduce Motion is on.
  const translateY = reduceMotion ? 0 : progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return (
    <View pointerEvents="none" style={[styles.host, { bottom: insets.bottom + space[6] }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        testID="toast"
        style={[
          styles.toast,
          { backgroundColor: colors.ink, borderColor: border, opacity: progress, transform: [{ translateY }] },
        ]}
      >
        <Text variant="body" color="surface0" align="center">
          {toast.message}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: space[4], right: space[4], alignItems: 'center' },
  toast: {
    maxWidth: 480,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
  },
});
