import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { CALISTHENICS_BODYWEIGHT_MODELS } from './calisthenicsModels.ts';

import { normalizeModelUrl } from '../components/common/HolographicCoach.tsx';

// Enable Three.js internal cache for instant memory hits
THREE.Cache.enabled = true;

const preloadedUrls = new Set<string>();

/**
 * Preloads an array of 3D model URLs for the current active workout plan.
 * Uses useGLTF.preload to cache directly in Three.js memory without blocking network pipes.
 */
export function preloadWorkoutModels(urls: (string | undefined)[]): void {
  if (typeof window === 'undefined') return;

  const validUrls = urls
    .map(u => normalizeModelUrl(u))
    .filter((u): u is string => Boolean(u && (u.trim().startsWith('http') || u.trim().startsWith('/'))));

  if (validUrls.length === 0) return;

  // 1. Immediately preload the first/current model on the current tick (zero wait)
  const firstUrl = validUrls[0];
  if (firstUrl && !preloadedUrls.has(firstUrl)) {
    try {
      useGLTF.preload(firstUrl);
      preloadedUrls.add(firstUrl);
    } catch (e) {}
  }

  // 2. Preload upcoming models sequentially with subtle stagger so mobile doesn't stutter
  const remaining = validUrls.slice(1);
  remaining.forEach((url, i) => {
    if (preloadedUrls.has(url)) return;
    setTimeout(() => {
      try {
        useGLTF.preload(url);
        preloadedUrls.add(url);
      } catch (e) {}
    }, 1200 * (i + 1));
  });
}

