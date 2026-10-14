import { create } from 'zustand';

import type { FilterId } from './filters';

/** Decorations live in canvas space (1200×3600) and are baked into the result (PLAN 좌표계). */
export type Decoration =
  | { kind: 'sticker'; key: string; image: string; x: number; y: number; size: number; rotation: number }
  | { kind: 'text'; key: string; text: string; x: number; y: number; size: number; rotation: number; color: string }
  | { kind: 'pen'; key: string; points: number[]; color: string; width: number };

export type Placed = Extract<Decoration, { kind: 'sticker' | 'text' }>;

interface DecorateState {
  filter: FilterId;
  items: Decoration[];
  /** Earlier `items` snapshots for Undo. */
  history: Decoration[][];
  dateFormat: number | null;
  selected: string | null;
  setFilter: (filter: FilterId) => void;
  commit: (items: Decoration[]) => void;
  undo: () => void;
  setDate: (format: number | null) => void;
  select: (key: string | null) => void;
  reset: () => void;
}

const initial = { filter: 'original' as FilterId, items: [], history: [], dateFormat: null, selected: null };

export const useDecorate = create<DecorateState>((set) => ({
  ...initial,
  setFilter: (filter) => set({ filter }),
  commit: (items) => set((s) => ({ history: [...s.history, s.items], items })),
  undo: () =>
    set((s) => (s.history.length ? { items: s.history[s.history.length - 1]!, history: s.history.slice(0, -1), selected: null } : s)),
  setDate: (dateFormat) => set({ dateFormat }),
  select: (selected) => set({ selected }),
  reset: () => set(initial),
}));

let counter = 0;
export const newKey = () => `d${Date.now()}-${counter++}`;
