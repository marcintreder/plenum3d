export const getConstrainedPosition = (pos, axis, lastPos) => {
  const constrained = [...pos];
  if (axis === 'x') { constrained[1] = lastPos[1]; constrained[2] = lastPos[2]; }
  if (axis === 'y') { constrained[0] = lastPos[0]; constrained[2] = lastPos[2]; }
  if (axis === 'z') { constrained[0] = lastPos[0]; constrained[1] = lastPos[1]; }
  return constrained;
};
