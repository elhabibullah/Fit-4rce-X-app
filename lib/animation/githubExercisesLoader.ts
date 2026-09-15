import * as THREE from 'three';
import { HumanoidMotionClip, MotionKeyframe } from './animationClips.ts';
import { HumanoidBoneName } from './humanoidBones.ts';
import { ExerciseDefinition } from './exerciseDefinitions.ts';

export interface RawJsonExercise {
  id: string;
  name: string;
  equipment?: string;
  difficulty?: string;
  prop?: any;
  primary?: string[];
  secondary?: string[];
  steps?: string[];
  fps?: number;
  duration?: number;
  keyframes?: Array<{
    t: number;
    bones: Record<string, {
      rot?: [number, number, number];
      loc?: [number, number, number];
      aim_world?: [number, number, number];
    }>;
  }>;
  mocap?: string;
  camera?: string;
  status?: string;
}

const EXERCICES_JSON_URL = 'https://raw.githubusercontent.com/elhabibullah/mon-stockage-media/refs/heads/main/exercices-json';

// In-memory cache for parsed clips and exercise items
let cachedRawExercises: RawJsonExercise[] | null = null;
let cachedJsonClips: Map<string, HumanoidMotionClip> = new Map();
let fetchPromise: Promise<RawJsonExercise[]> | null = null;

/**
 * Degrees to radians helper
 */
function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Converts a direction vector (aim_world) in character coordinates to anatomical pitch/yaw/roll.
 *
 * Coordinate system convention of aim_world in character space:
 * - aim[0] = lateral X (positive is right/abduction, negative is left/adduction)
 * - aim[1] = sagittal forward/backward Y: in Blender character frame, positive is back, negative is forward flex
 * - aim[2] = vertical Z: in Blender, -1 is straight down, 0 is horizontal, +1 is straight up
 *
 * For character anatomical pitch/yaw/roll:
 * - pitch: flexion angle forward (positive)
 * - roll: abduction angle laterally away from midline (positive)
 */
function solveAimWorldToPitchYawRoll(
  aim: [number, number, number],
  isRightSide: boolean
): { pitch: number; yaw: number; roll: number } {
  const ax = aim[0] || 0;
  const ay = aim[1] || 0;
  const az = aim[2] || 0;

  // Pitch: angle in sagittal plane relative to straight down (-Z)
  // When arm extends forward (ay < 0, az ~ 0), forward pitch tilts arm up/forward
  const forwardFlex = -ay;
  const downward = -az;
  const pitch = -Math.atan2(forwardFlex, Math.max(-0.99, downward));

  // Roll: lateral abduction away from body
  const lateral = isRightSide ? ax : -ax;
  const roll = Math.atan2(lateral, Math.max(0.01, Math.sqrt(forwardFlex * forwardFlex + downward * downward)));

  return {
    pitch: THREE.MathUtils.clamp(pitch, -degToRad(170), degToRad(30)),
    yaw: 0,
    roll: THREE.MathUtils.clamp(roll, -degToRad(20), degToRad(90)),
  };
}

/**
 * Map bone keys from Blender / Mixamo JSON export to HumanoidStandard names and anatomical euler angles.
 *
 * Blender export format:
 * - rot: [X, Y, Z] in degrees
 * - thigh.*, thigh.L, thigh.R
 * - shin.*, shin.L, shin.R
 * - foot.*, foot.L, foot.R
 * - upper_arm.*
 * - forearm.*
 * - hand.*
 * - pelvis, spine, chest, head
 */
function convertBlenderKeyframesToMotion(raw: RawJsonExercise): HumanoidMotionClip | null {
  if (!raw.keyframes || raw.keyframes.length === 0) {
    return null;
  }

  const duration = raw.duration && raw.duration > 0 ? raw.duration : 2.5;

  const motionKeyframes: MotionKeyframe[] = raw.keyframes.map((kf) => {
    const bonesRot: Partial<Record<HumanoidBoneName, { pitch: number; yaw: number; roll: number }>> = {};

    let hipsOffsetX = 0;
    let hipsOffsetY = 0;
    let hipsOffsetZ = 0;
    let proneAngle = 0;

    const b = kf.bones || {};

    // 1. Pelvis / Hips
    if (b.pelvis) {
      if (b.pelvis.loc && Array.isArray(b.pelvis.loc)) {
        // Blender coords: loc[0] = lateral X, loc[1] = sagittal Y, loc[2] = vertical Z
        // In three.js humanoid coordinate space:
        // hipsOffset[0] is lateral X
        // hipsOffset[1] is vertical Y (maps from Blender Z: loc[2])
        // hipsOffset[2] is sagittal Z (maps from Blender Y: loc[1])
        hipsOffsetX = (b.pelvis.loc[0] || 0) * 0.8;
        hipsOffsetY = (b.pelvis.loc[2] || 0) * 0.8;
        hipsOffsetZ = (b.pelvis.loc[1] || 0) * 0.8;
      }
      if (b.pelvis.rot && Array.isArray(b.pelvis.rot)) {
        // If pelvis has strong pitch forward (e.g. 68-88 deg in push-up, superman, plank)
        const pitchDeg = b.pelvis.rot[0] || 0;
        if (pitchDeg > 45) {
          proneAngle = degToRad(pitchDeg);
        } else if (pitchDeg < -45) {
          // Supine floor exercises (glute_bridge, crunch):
          // Model lies on back (proneAngle ~ -PI/2)
          proneAngle = degToRad(pitchDeg);
        } else {
          bonesRot.Hips = {
            pitch: degToRad(b.pelvis.rot[0] || 0),
            yaw: degToRad(b.pelvis.rot[1] || 0),
            roll: degToRad(b.pelvis.rot[2] || 0),
          };
        }
      }
    }

    // 2. Spine & Chest
    if (b.spine && b.spine.rot) {
      bonesRot.Spine = {
        pitch: degToRad(b.spine.rot[0] || 0),
        yaw: degToRad(b.spine.rot[1] || 0),
        roll: degToRad(b.spine.rot[2] || 0),
      };
    }
    if (b.chest && b.chest.rot) {
      bonesRot.Spine1 = {
        pitch: degToRad(b.chest.rot[0] || 0),
        yaw: degToRad(b.chest.rot[1] || 0),
        roll: degToRad(b.chest.rot[2] || 0),
      };
    }

    // 3. Head & Neck
    if (b.head && b.head.rot) {
      bonesRot.Head = {
        pitch: degToRad(b.head.rot[0] || 0),
        yaw: degToRad(b.head.rot[1] || 0),
        roll: degToRad(b.head.rot[2] || 0),
      };
    }

    // 4. Thigh / Femur (Legs)
    const thighWildcard = b['thigh.*']?.rot;
    const thighL = b['thigh.L']?.rot || thighWildcard;
    const thighR = b['thigh.R']?.rot || thighWildcard;

    if (thighL) {
      // In humanoid retargeter pitch: negative is forward flex (e.g. squat, lunges: -72 deg)
      bonesRot.LeftUpLeg = {
        pitch: degToRad(thighL[0] || 0),
        yaw: degToRad(thighL[1] || 0),
        roll: degToRad(thighL[2] || 0),
      };
    }
    if (thighR) {
      bonesRot.RightUpLeg = {
        pitch: degToRad(thighR[0] || 0),
        yaw: degToRad(thighR[1] || 0),
        roll: degToRad(thighR[2] || 0),
      };
    }

    // 5. Shin / Tibia (Knees)
    const shinWildcard = b['shin.*']?.rot;
    const shinL = b['shin.L']?.rot || shinWildcard;
    const shinR = b['shin.R']?.rot || shinWildcard;

    if (shinL) {
      bonesRot.LeftLeg = {
        pitch: degToRad(shinL[0] || 0),
        yaw: degToRad(shinL[1] || 0),
        roll: degToRad(shinL[2] || 0),
      };
    }
    if (shinR) {
      bonesRot.RightLeg = {
        pitch: degToRad(shinR[0] || 0),
        yaw: degToRad(shinR[1] || 0),
        roll: degToRad(shinR[2] || 0),
      };
    }

    // 6. Foot / Ankle
    const footWildcard = b['foot.*']?.rot;
    const footL = b['foot.L']?.rot || footWildcard;
    const footR = b['foot.R']?.rot || footWildcard;

    if (footL) {
      bonesRot.LeftFoot = {
        pitch: degToRad(footL[0] || 0),
        yaw: degToRad(footL[1] || 0),
        roll: degToRad(footL[2] || 0),
      };
    }
    if (footR) {
      bonesRot.RightFoot = {
        pitch: degToRad(footR[0] || 0),
        yaw: degToRad(footR[1] || 0),
        roll: degToRad(footR[2] || 0),
      };
    }

    // 7. Upper Arm (Shoulders / Humerus)
    const uarmData = b['upper_arm.*'] || b['upper_arm.L'] || b['upper_arm.R'];
    if (uarmData) {
      if (uarmData.aim_world) {
        // Exercise uses directional aim_world vector (e.g. squat, deadlift, sumo_squat)
        const leftArmPose = solveAimWorldToPitchYawRoll(uarmData.aim_world, false);
        const rightArmPose = solveAimWorldToPitchYawRoll(uarmData.aim_world, true);
        bonesRot.LeftArm = leftArmPose;
        bonesRot.RightArm = rightArmPose;
      } else if (uarmData.rot) {
        // Euler rotation:
        // rot[0] is sagittal pitch (forward flexion/elevation)
        // rot[2] is coronal roll/abduction (e.g. jumping_jack, overhead_press)
        bonesRot.LeftArm = {
          pitch: degToRad(uarmData.rot[0] || 0),
          yaw: degToRad(uarmData.rot[1] || 0),
          roll: degToRad(uarmData.rot[2] || 0),
        };
        bonesRot.RightArm = {
          pitch: degToRad(uarmData.rot[0] || 0),
          yaw: degToRad(uarmData.rot[1] || 0),
          roll: degToRad(uarmData.rot[2] || 0),
        };
      }
    }

    // 8. Forearm (Elbows / Radius)
    const farmData = b['forearm.*'] || b['forearm.L'] || b['forearm.R'];
    if (farmData) {
      if (farmData.aim_world) {
        // Natural elbow flexion follows arm extension
        bonesRot.LeftForeArm = { pitch: degToRad(15), yaw: 0, roll: 0 };
        bonesRot.RightForeArm = { pitch: degToRad(15), yaw: 0, roll: 0 };
      } else if (farmData.rot) {
        // In the JSON exports (e.g. bicep_curl, overhead_press, push_up),
        // elbow flexion angle is stored as negative roll (rot[2] = -125 deg) or pitch (rot[0] = -60 deg).
        // In the humanoid anatomical retargeter, elbow flexion is positive pitch (0 to 140 deg).
        const rawPitch = farmData.rot[0] || 0;
        const rawRoll = farmData.rot[2] || 0;
        let elbowPitch = 0;
        if (Math.abs(rawPitch) > 5) {
          elbowPitch = degToRad(Math.abs(rawPitch));
        } else if (Math.abs(rawRoll) > 5) {
          elbowPitch = degToRad(Math.abs(rawRoll));
        }

        bonesRot.LeftForeArm = {
          pitch: elbowPitch,
          yaw: degToRad(farmData.rot[1] || 0),
          roll: 0,
        };
        bonesRot.RightForeArm = {
          pitch: elbowPitch,
          yaw: degToRad(farmData.rot[1] || 0),
          roll: 0,
        };
      }
    }

    // 9. Hand
    const handWildcard = b['hand.*']?.rot;
    if (handWildcard) {
      bonesRot.LeftHand = {
        pitch: degToRad(handWildcard[0] || 0),
        yaw: degToRad(handWildcard[1] || 0),
        roll: degToRad(handWildcard[2] || 0),
      };
      bonesRot.RightHand = {
        pitch: degToRad(handWildcard[0] || 0),
        yaw: degToRad(handWildcard[1] || 0),
        roll: degToRad(handWildcard[2] || 0),
      };
    }

    return {
      time: Math.max(0, Math.min(1, kf.t)),
      hipsOffset: [hipsOffsetX, hipsOffsetY, hipsOffsetZ],
      proneAngle: Math.abs(proneAngle) > 0.05 ? proneAngle : undefined,
      bones: bonesRot,
    };
  });

  return new HumanoidMotionClip(
    raw.id,
    raw.name || raw.id,
    duration,
    motionKeyframes
  );
}

/**
 * Fetch and parse the raw concatenated JSON from GitHub
 */
export async function loadGithubExercisesJson(): Promise<RawJsonExercise[]> {
  if (cachedRawExercises) {
    return cachedRawExercises;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const res = await fetch(EXERCICES_JSON_URL);
      if (!res.ok) {
        throw new Error(`Failed to fetch exercices-json: status ${res.status}`);
      }
      const rawText = await res.text();

      // The file contains 35 concatenated JSON objects without an outer array.
      // Parse with an incremental JSON scanner.
      const items: RawJsonExercise[] = [];
      let depth = 0;
      let inString = false;
      let escape = false;
      let startIdx = -1;

      for (let i = 0; i < rawText.length; i++) {
        const char = rawText[i];

        if (escape) {
          escape = false;
          continue;
        }

        if (char === '\\') {
          escape = true;
          continue;
        }

        if (char === '"') {
          inString = !inString;
          continue;
        }

        if (!inString) {
          if (char === '{') {
            if (depth === 0) {
              startIdx = i;
            }
            depth++;
          } else if (char === '}') {
            depth--;
            if (depth === 0 && startIdx !== -1) {
              const chunk = rawText.slice(startIdx, i + 1).trim();
              try {
                const parsed = JSON.parse(chunk);
                if (parsed && parsed.id) {
                  items.push(parsed);
                }
              } catch (err) {
                console.warn('Error parsing JSON chunk from exercices-json:', err);
              }
              startIdx = -1;
            }
          }
        }
      }

      cachedRawExercises = items;

      // Convert all exercises having keyframes into live 3D MotionClips
      for (const ex of items) {
        if (ex.keyframes && ex.keyframes.length > 0) {
          const clip = convertBlenderKeyframesToMotion(ex);
          if (clip) {
            cachedJsonClips.set(ex.id.toLowerCase(), clip);
          }
        }
      }

      return items;
    } catch (error) {
      console.error('loadGithubExercisesJson error:', error);
      return [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Get a loaded 3D motion clip from GitHub JSON by exercise ID
 */
export function getGithubJsonClip(exerciseIdOrQuery: string): HumanoidMotionClip | null {
  if (!exerciseIdOrQuery) return null;
  const clean = exerciseIdOrQuery.toLowerCase().trim().replace(/[- ]/g, '_');

  // Exact ID match
  if (cachedJsonClips.has(clean)) {
    return cachedJsonClips.get(clean)!;
  }

  // Substring match (e.g. "squat" matches "squat", "pushup" matches "push_up")
  for (const [id, clip] of cachedJsonClips.entries()) {
    if (clean === id || clean.includes(id) || id.includes(clean)) {
      return clip;
    }
  }

  return null;
}

/**
 * Get all available exercises from the GitHub JSON
 */
export function getCachedGithubExercises(): RawJsonExercise[] {
  return cachedRawExercises || [];
}
