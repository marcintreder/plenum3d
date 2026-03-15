import * as THREE from 'three';
import { SUBTRACTION, ADDITION, INTERSECTION, Brush, Evaluator } from 'three-bvh-csg';

export const performCSG = (a, b, operation) => {
  // Ensure geometries are computed
  a.geometry.computeVertexNormals();
  b.geometry.computeVertexNormals();
  
  const brushA = new Brush(a.geometry, a.material);
  const brushB = new Brush(b.geometry, b.material);
  
  const evaluator = new Evaluator();
  
  let result;
  switch(operation) {
    case 'union': result = evaluator.evaluate(brushA, brushB, ADDITION); break;
    case 'subtract': result = evaluator.evaluate(brushA, brushB, SUBTRACTION); break;
    case 'intersect': result = evaluator.evaluate(brushA, brushB, INTERSECTION); break;
    default: return null;
  }
  
  return result;
};
