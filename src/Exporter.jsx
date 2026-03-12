import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import useStore from './useStore';

const Exporter = () => {
  const { scene } = useThree();
  const { exportRequested, setExportRequested } = useStore();

  useEffect(() => {
    if (exportRequested) {
      const exporter = new GLTFExporter();
      
      // Filter out helpers (Grid, Gizmos) if any, but scene usually contains everything.
      // We want to export just our EditableMesh ideally.
      // But scene.children[0] might be the mesh.
      
      exporter.parse(
        scene,
        (result) => {
          let blob;
          if (result instanceof ArrayBuffer) {
            blob = new Blob([result], { type: 'application/octet-stream' });
          } else {
            blob = new Blob([JSON.stringify(result)], { type: 'application/json' });
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = result instanceof ArrayBuffer ? 'model.glb' : 'model.gltf';
          link.click();
          URL.revokeObjectURL(url);
          setExportRequested(false);
        },
        (error) => {
          console.error('An error happened during parsing', error);
          setExportRequested(false);
        },
        { binary: true }
      );
    }
  }, [exportRequested, scene, setExportRequested]);

  return null;
};

export default Exporter;
