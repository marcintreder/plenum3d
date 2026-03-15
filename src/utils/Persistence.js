export const saveScene = (objects) => {
  localStorage.setItem('sculpt3d_scene', JSON.stringify(objects));
};
export const loadScene = () => {
  const data = localStorage.getItem('sculpt3d_scene');
  return data ? JSON.parse(data) : null;
};
