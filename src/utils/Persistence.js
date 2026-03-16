export const saveScene = (objects) => {
  localStorage.setItem('plenum3d_scene', JSON.stringify(objects));
};
export const loadScene = () => {
  const data = localStorage.getItem('plenum3d_scene');
  return data ? JSON.parse(data) : null;
};
