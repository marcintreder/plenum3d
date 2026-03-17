/**
 * Returns IDs of visible objects whose projected screen position falls within
 * the marquee rectangle.
 *
 * @param {Object[]} objects - Store objects array
 * @param {{x1: number, y1: number, x2: number, y2: number}} marqueeRect - Screen pixel bounds
 * @param {function} projectToScreen - (position: [x,y,z]) => { x: number, y: number }
 * @returns {string[]} IDs of objects inside the marquee
 */
export function getObjectIdsInMarquee(objects, marqueeRect, projectToScreen) {
  const minX = Math.min(marqueeRect.x1, marqueeRect.x2);
  const maxX = Math.max(marqueeRect.x1, marqueeRect.x2);
  const minY = Math.min(marqueeRect.y1, marqueeRect.y2);
  const maxY = Math.max(marqueeRect.y1, marqueeRect.y2);

  return objects
    .filter(o => o.visible !== false)
    .filter(o => {
      const { x, y } = projectToScreen(o.position || [0, 0, 0]);
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    })
    .map(o => o.id);
}
