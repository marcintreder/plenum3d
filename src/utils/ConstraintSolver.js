import * as THREE from 'three';

export const solveDistanceConstraint = (p1, p2, targetDist) => {
  const v = new THREE.Vector3().fromArray(p2).sub(new THREE.Vector3().fromArray(p1));
  const currentDist = v.length();
  const diff = (currentDist - targetDist) / currentDist;
  const correction = v.multiplyScalar(diff * 0.5);
  return {
    p1: new THREE.Vector3(...p1).add(correction).toArray(),
    p2: new THREE.Vector3(...p2).sub(correction).toArray()
  };
};
