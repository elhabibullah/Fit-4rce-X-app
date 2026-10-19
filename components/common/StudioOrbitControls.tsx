import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

export interface StudioOrbitControlsProps {
  controlsRef?: React.RefObject<any>;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableDamping?: boolean;
  dampingFactor?: number;
  target?: [number, number, number] | THREE.Vector3;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  makeDefault?: boolean;
}

export const StudioOrbitControls: React.FC<StudioOrbitControlsProps> = ({
  controlsRef,
  enableZoom = true,
  enablePan = false,
  enableDamping = true,
  dampingFactor = 0.05,
  target = [0, -0.12, 0],
  minDistance = 1.2,
  maxDistance = 5.5,
  minPolarAngle = Math.PI / 4,
  maxPolarAngle = Math.PI / 1.75,
}) => {
  const { camera, gl } = useThree();
  const innerControls = useRef<ThreeOrbitControls | null>(null);

  useEffect(() => {
    if (!camera || !gl?.domElement) return;

    const controls = new ThreeOrbitControls(camera, gl.domElement);
    controls.enableZoom = enableZoom;
    controls.enablePan = enablePan;
    controls.enableDamping = enableDamping;
    controls.dampingFactor = dampingFactor;

    if (Array.isArray(target)) {
      controls.target.set(target[0], target[1], target[2]);
    } else if (target) {
      controls.target.copy(target);
    }

    if (minDistance !== undefined) controls.minDistance = minDistance;
    if (maxDistance !== undefined) controls.maxDistance = maxDistance;
    if (minPolarAngle !== undefined) controls.minPolarAngle = minPolarAngle;
    if (maxPolarAngle !== undefined) controls.maxPolarAngle = maxPolarAngle;

    controls.update();
    innerControls.current = controls;

    if (controlsRef) {
      (controlsRef as any).current = controls;
    }

    return () => {
      controls.dispose();
      if (controlsRef && (controlsRef as any).current === controls) {
        (controlsRef as any).current = null;
      }
      innerControls.current = null;
    };
  }, [camera, gl, enableZoom, enablePan, enableDamping, dampingFactor, minDistance, maxDistance, minPolarAngle, maxPolarAngle]);

  useFrame(() => {
    if (innerControls.current && innerControls.current.enabled) {
      innerControls.current.update();
    }
  });

  return null;
};

export default StudioOrbitControls;
