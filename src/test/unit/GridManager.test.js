import { describe, it, expect } from 'vitest';
import { snap, getGridSnap } from '../../utils/GridManager';

describe('GridManager', () => {
  it('should snap values to the correct step', () => {
    expect(snap(0.12, 0.1)).toBe(0.1);
    expect(snap(0.18, 0.1)).toBe(0.2);
    expect(snap(0.55, 0.5)).toBe(0.5);
  });

  it('should snap vector3 coordinates', () => {
    const pos = [0.12, 0.55, 0.99];
    const snapped = getGridSnap(pos, 0.1);
    expect(snapped).toEqual([0.1, 0.6, 1.0]);
  });
});
