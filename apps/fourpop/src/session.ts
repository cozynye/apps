import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { create } from 'zustand';

import { useDecorate } from './decorate';

/** One shot: the full image (long edge 2400) on disk and a 480px thumbnail for the UI (PLAN 메모리). */
export interface Shot {
  uri: string;
  thumbUri: string;
  width: number;
  height: number;
}

export const SHOTS = 8;
export const PICKS = 4;

interface SessionState {
  source: 'camera' | 'album';
  shots: (Shot | null)[];
  /** Picked shot indices in strip order (B6). */
  picked: number[];
  startedAt: number;
}

/** In-memory booth session (PLAN 상태 경계 › Zustand boothSession). */
export const useSession = create<SessionState>(() => ({
  source: 'camera',
  shots: Array(SHOTS).fill(null),
  picked: [],
  startedAt: 0,
}));

export const sessionDir = new Directory(Paths.cache, 'booth-session');

/** Starts a fresh session; shots from the previous one are deleted (PLAN 예외 › 촬영 도중 앱 종료). */
export function resetSession(source: SessionState['source']) {
  clearSessionFiles();
  useDecorate.getState().reset();
  sessionDir.create({ intermediates: true, idempotent: true });
  useSession.setState({ source, shots: Array(SHOTS).fill(null), picked: [], startedAt: Date.now() });
}

export function clearSessionFiles() {
  if (sessionDir.exists) sessionDir.delete();
}

const LONG_EDGE = 2400;
const THUMB = 480;

/**
 * Saves a captured or imported photo as shot `index`: long edge 2400 JPEG 90 + 480px thumbnail
 * (only thumbnails stay in memory). File names change per capture so retakes never show stale images.
 */
export async function storeShot(index: number, uri: string, width: number, height: number): Promise<Shot> {
  const stamp = Date.now();
  const full = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > LONG_EDGE) full.resize(width >= height ? { width: LONG_EDGE } : { height: LONG_EDGE });
  const fullResult = await (await full.renderAsync()).saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
  const thumb = ImageManipulator.manipulate(fullResult.uri);
  thumb.resize(fullResult.width >= fullResult.height ? { width: THUMB } : { height: THUMB });
  const thumbResult = await (await thumb.renderAsync()).saveAsync({ compress: 0.8, format: SaveFormat.JPEG });

  sessionDir.create({ intermediates: true, idempotent: true });
  const fullFile = new File(sessionDir, `${index}-${stamp}.jpg`);
  const thumbFile = new File(sessionDir, `${index}-${stamp}-thumb.jpg`);
  await new File(fullResult.uri).move(fullFile);
  await new File(thumbResult.uri).move(thumbFile);

  const shot: Shot = { uri: fullFile.uri, thumbUri: thumbFile.uri, width: fullResult.width, height: fullResult.height };
  const old = useSession.getState().shots[index];
  useSession.setState((s) => {
    const shots = [...s.shots];
    shots[index] = shot;
    return { shots };
  });
  if (old) {
    for (const uri of [old.uri, old.thumbUri]) {
      const f = new File(uri);
      if (f.exists) f.delete();
    }
  }
  return shot;
}
