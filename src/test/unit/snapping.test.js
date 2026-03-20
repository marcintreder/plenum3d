const snap = (pos, grid) => {
  if (grid === 0) return pos;
  return Math.round(pos / grid) * grid;
};

describe('snapping', () => {
    test('snaps 0.4 to 0.5 with 0.5 grid', () => {
        expect(snap(0.4, 0.5)).toBe(0.5);
    });
    test('snaps 0.2 to 0.0 with 0.5 grid', () => {
        expect(snap(0.2, 0.5)).toBe(0);
    });
});
