import { CANVAS, coverSource, toCanvas } from './geometry';
import { applyMatrix, FILTER_SPECS, multiply } from './filters';

const slot = { x: 60, y: 80, w: 1080, h: 720 }; // 3:2

describe('coverSource', () => {
  it('crops the sides of a wider image', () => {
    expect(coverSource(slot, 4000, 2000)).toEqual({ x: 500, y: 0, w: 3000, h: 2000 });
  });
  it('crops top and bottom of a portrait image', () => {
    expect(coverSource(slot, 1200, 1800)).toEqual({ x: 0, y: 500, w: 1200, h: 800 });
  });
  it('keeps an exact 3:2 image whole', () => {
    expect(coverSource(slot, 2400, 1600)).toEqual({ x: 0, y: 0, w: 2400, h: 1600 });
  });
});

describe('toCanvas', () => {
  it('scales preview points into the 1200×3600 canvas', () => {
    expect(toCanvas(150, 450, 300)).toEqual({ x: 600, y: 1800 });
    expect(toCanvas(300, 900, 300)).toEqual({ x: CANVAS.w, y: CANVAS.h });
  });
});

describe('filters', () => {
  const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 4));
  it('original keeps colours', () => {
    close(applyMatrix(FILTER_SPECS.original.matrix, [0.2, 0.5, 0.8]), [0.2, 0.5, 0.8]);
  });
  it('mono maps every channel to luma', () => {
    const [r, g, b] = applyMatrix(FILTER_SPECS.mono.matrix, [1, 0, 0]);
    close([r, g, b], [0.2126, 0.2126, 0.2126]);
  });
  it('warm boosts red with an offset and cuts blue', () => {
    close(applyMatrix(FILTER_SPECS.warm.matrix, [0.5, 0.5, 0.5]), [0.56, 0.51, 0.46]);
  });
  it('multiply applies the right matrix first', () => {
    const double = [2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0];
    const plusTenth = [1, 0, 0, 0, 0.1, 0, 1, 0, 0, 0.1, 0, 0, 1, 0, 0.1, 0, 0, 0, 1, 0];
    close(applyMatrix(multiply(plusTenth, double), [0.2, 0.2, 0.2]), [0.5, 0.5, 0.5]);
  });
  it('grain only on film, fade and night', () => {
    expect([FILTER_SPECS.original.grain, FILTER_SPECS.mono.grain, FILTER_SPECS.warm.grain]).toEqual([0, 0, 0]);
    expect(FILTER_SPECS.film.grain).toBeGreaterThan(0);
  });
});
