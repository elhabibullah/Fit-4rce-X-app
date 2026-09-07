// Shim for three/tsl to provide missing instancedArray export for three-mediapipe-rig with three@0.170.0
export * from 'three/webgpu';
export const instancedArray = (attr: any, type: any) => ({
  element: (idx: any) => ({ xy: [0, 0], x: 0, y: 0, z: 0 })
});
