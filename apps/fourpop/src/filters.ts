/** Color filters (PLAN 구현 명세 › 필터): 4×5 matrices (offsets 0..1) + grain amount. */
export type FilterId = 'original' | 'mono' | 'warm' | 'film' | 'fade' | 'night';
export const FILTERS: FilterId[] = ['original', 'mono', 'warm', 'film', 'fade', 'night'];
/** Original, Mono, Warm are free; Film, Fade, Night need Premium. */
export const PREMIUM_FILTERS: ReadonlySet<FilterId> = new Set(['film', 'fade', 'night']);

type Matrix = number[]; // 20 numbers, row-major 4×5

const IDENTITY: Matrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
const LUMA = [0.2126, 0.7152, 0.0722];

/** a ∘ b: apply b first, then a. */
export function multiply(a: Matrix, b: Matrix): Matrix {
  const out: Matrix = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      let v = c === 4 ? a[r * 5 + 4]! : 0;
      for (let k = 0; k < 4; k++) v += a[r * 5 + k]! * b[k * 5 + c]!;
      out.push(v);
    }
  }
  return out;
}

export function saturation(s: number): Matrix {
  const [lr, lg, lb] = LUMA as [number, number, number];
  const i = 1 - s;
  return [
    lr * i + s,
    lg * i,
    lb * i,
    0,
    0,
    lr * i,
    lg * i + s,
    lb * i,
    0,
    0,
    lr * i,
    lg * i,
    lb * i + s,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];
}

/** Contrast around mid-grey. */
export function contrast(c: number): Matrix {
  const o = 0.5 * (1 - c);
  return [c, 0, 0, 0, o, 0, c, 0, 0, o, 0, 0, c, 0, o, 0, 0, 0, 1, 0];
}

export function channels(r: number, g: number, b: number, offset: [number, number, number] = [0, 0, 0]): Matrix {
  return [r, 0, 0, 0, offset[0], 0, g, 0, 0, offset[1], 0, 0, b, 0, offset[2], 0, 0, 0, 1, 0];
}

/** Adds a constant to RGB (shadow / black lift). */
export const lift = (v: number) => channels(1, 1, 1, [v, v, v]);

const MONO: Matrix = [...LUMA, 0, 0, ...LUMA, 0, 0, ...LUMA, 0, 0, 0, 0, 0, 1, 0];

export const FILTER_SPECS: Record<FilterId, { matrix: Matrix; grain: number }> = {
  original: { matrix: IDENTITY, grain: 0 },
  mono: { matrix: MONO, grain: 0 },
  warm: { matrix: channels(1.08, 1.02, 0.92, [0.02, 0, 0]), grain: 0 },
  film: { matrix: multiply(lift(0.03), multiply(contrast(1.1), saturation(0.85))), grain: 0.06 },
  fade: { matrix: multiply(lift(0.08), multiply(contrast(0.9), saturation(0.9))), grain: 0.03 },
  night: { matrix: multiply(contrast(1.05), multiply(channels(0.92, 1, 1.1), saturation(0.8))), grain: 0.05 },
};

/** Applies a matrix to one RGB colour in 0..1 (tests and previews). */
export function applyMatrix(m: Matrix, [r, g, b]: [number, number, number]): [number, number, number] {
  const row = (i: number) => m[i * 5]! * r + m[i * 5 + 1]! * g + m[i * 5 + 2]! * b + m[i * 5 + 4]!;
  return [row(0), row(1), row(2)];
}
