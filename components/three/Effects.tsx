"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/store";

export function ProfitCore() {
  const ref = useRef<THREE.Group>(null);
  const scene = useExperience((state) => state.scene);
  const visible = ["profit", "leakage", "command", "roles", "ai", "simulator", "integrations", "pricing", "final"].includes(scene);

  useFrame((_, delta) => {
    if (ref.current && visible) ref.current.rotation.y += delta * 0.55;
  });

  return (
    <group ref={ref} visible={visible} position={[0, 1.4, 0]}>
      <mesh>
        <icosahedronGeometry args={[0.58, 2]} />
        <meshStandardMaterial color="#9EF36A" emissive="#46D269" emissiveIntensity={1.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.9, 0.025, 10, 64]} />
        <meshBasicMaterial color="#A8F36A" />
      </mesh>
      <pointLight color="#A8F36A" intensity={10} distance={5} />
    </group>
  );
}

export function LeakParticles() {
  const ref = useRef<THREE.Group>(null);
  const scene = useExperience((state) => state.scene);
  const intensity = useExperience((state) => state.leak);
  const visible = ["problem", "leakage", "simulator"].includes(scene);

  const seeds = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        x: (((index * 0.618) % 1) - 0.5) * 2.2,
        y: 0.4 + ((index * 0.414 + 0.17) % 1) * 3,
        z: (((index * 0.732 + 0.31) % 1) - 0.5) * 2,
        speed: 0.35 + ((index * 0.27) % 1) * 0.7,
      })),
    []
  );

  useFrame((_, delta) => {
    if (!ref.current || !visible) return;
    ref.current.children.forEach((child, index) => {
      child.position.y -= delta * seeds[index].speed * (0.7 + intensity * 2);
      if (child.position.y < 0) child.position.y = 3.4;
    });
  });

  return (
    <group ref={ref} visible={visible}>
      {seeds.map((particle, index) => (
        <mesh key={index} position={[particle.x, particle.y, particle.z]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshBasicMaterial color={index % 3 ? "#FF6B62" : "#FFB55E"} />
        </mesh>
      ))}
    </group>
  );
}
