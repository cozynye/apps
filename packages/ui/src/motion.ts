import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** iOS Reduce Motion: drop movement and scaling, keep fades (DESIGN_SYSTEM 모션 › reduceMotion). */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}
