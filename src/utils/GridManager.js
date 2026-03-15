export const snap = (value, step) => {
  return Math.round(value / step) * step;
};

export const snapVector3 = (vector, step) => {
  vector.x = snap(vector.x, step);
  vector.y = snap(vector.y, step);
  vector.z = snap(vector.z, step);
  return vector;
};

export const getGridSnap = (position, gridSize) => {
  return position.map(p => parseFloat(snap(p, gridSize).toFixed(10)));
};
