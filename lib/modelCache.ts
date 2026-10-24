import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { CALISTHENICS_BODYWEIGHT_MODELS } from './calisthenicsModels.ts';

// Enable Three.js internal cache for instant memory hits
THREE.Cache.enabled = true;

const CACHE_NAME = 'f4x-models-v1';
const preloadedUrls = new Set<string>();

/**
 * Preloads an array of 3D model URLs for the current active workout plan.
 * Uses useGLTF.preload to cache directly in Three.js memory without blocking network pipes.
 */
export function preloadWorkoutModels(urls: (string | undefined)[]): void {
  if (typeof window === 'undefined') return;

  const validUrls = urls.filter((u): u is string => Boolean(u && (u.trim().startsWith('http') || u.trim().startsWith('/'))));
  if (validUrls.length === 0) return;

  // 1. Immediately preload the first/current model on the current tick (zero wait)
  const firstUrl = validUrls[0];
  if (firstUrl && !preloadedUrls.has(firstUrl)) {
    try {
      useGLTF.preload(firstUrl);
      preloadedUrls.add(firstUrl);
    } catch (e) {}
  }

  // 2. Preload upcoming models concurrently
  const remaining = validUrls.slice(1);
  if (remaining.length > 0) {
    const preloadRest = () => {
      remaining.forEach(url => {
        if (preloadedUrls.has(url)) return;
        try {
          useGLTF.preload(url);
          preloadedUrls.add(url);
        } catch (e) {}
      });
    };
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(preloadRest);
    } else {
      setTimeout(preloadRest, 50);
    }
  }
}

