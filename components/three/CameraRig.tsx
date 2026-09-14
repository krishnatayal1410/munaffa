"use client";

import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperience } from "@/lib/store";

const cameras: Record<string, { position: [number, number, number]; look: [number, number, number] }> = {
  hero: { position: [10, 8, 13], look: [0, 1, 0] },
  problem: { position: [8, 7, 10], look: [0, 1, 0] },
  connect: { position: [8, 9, 11], look: [0, 1, 0] },
  ordering: { position: [5, 4, 7], look: [-2.8, 1, 2] },
  kitchen: { position: [6, 4, -1], look: [3, 1, -3] },
  inventory: { position: [7, 3, -5], look: [-4, 1, -4] },
  profit: { position: [7, 6, 8], look: [0, 1, 0] },
  leakage: { position: [5, 4, 5], look: [0, 1, 0] },
  command: { position: [9, 7, 11], look: [0, 1, 0] },
  roles: { position: [10, 5, 9], look: [0, 1, 0] },
  ai: { position: [7, 6, 8], look: [0, 1, 0] },
  simulator: { position: [8, 8, 11], look: [0, 1, 0] },
  integrations: { position: [9, 7, 10], look: [0, 1, 0] },
  pricing: { position: [11, 8, 13], look: [0, 1, 0] },
  final: { position: [12, 10, 16], look: [0, 1, 0] },
};

export function CameraRig() {
  const scene = useExperience((state) => state.scene);
  const reduced = useExperience((state) => state.reducedMotion);

  useFrame(({ camera, pointer }) => {
    const target = cameras[scene] ?? cameras.hero;
    camera.position.lerp(new THREE.Vector3(...target.position), reduced ? 0.16 : 0.045);

    const lookAt = new THREE.Vector3(...target.look);
    if (!reduced) {
      lookAt.x += pointer.x * 0.16;
      lookAt.y += pointer.y * 0.07;
    }
    camera.lookAt(lookAt);
  });

  return null;
}
