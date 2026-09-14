"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/store";
import { LeakParticles, ProfitCore } from "./Effects";

function Table({ x, z }: { x: number; z: number }) {
  const chairs: [number, number][] = [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]];
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.08, 24]} />
        <meshStandardMaterial color="#7A4627" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.7, 16]} />
        <meshStandardMaterial color="#46514B" metalness={0.45} />
      </mesh>
      {chairs.map(([cx, cz], index) => (
        <RoundedBox key={index} args={[0.5, 0.42, 0.5]} position={[cx, 0.46, cz]} radius={0.06}>
          <meshStandardMaterial color="#2E2119" />
        </RoundedBox>
      ))}
    </group>
  );
}

export function Diorama() {
  const root = useRef<THREE.Group>(null);
  const scene = useExperience((state) => state.scene);
  const tables: [number, number][] = [[-3.8, 1.7], [-1.2, 1.7], [1.5, 1.6], [-3.5, -0.8], [-0.8, -0.9], [2, -0.7]];

  useFrame(({ clock, pointer }) => {
    if (!root.current) return;
    root.current.position.y = Math.sin(clock.elapsedTime * 0.35) * 0.025;
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, pointer.x * 0.035, 0.03);
  });

  return (
    <group ref={root}>
      <RoundedBox args={[13, 0.35, 10]} position={[0, -0.22, 0]} radius={0.2}>
        <meshStandardMaterial color="#19231D" />
      </RoundedBox>
      <mesh position={[0, 1.8, -4.9]}>
        <boxGeometry args={[13, 4, 0.18]} />
        <meshStandardMaterial color="#152019" />
      </mesh>
      <mesh position={[-6.4, 1.8, 0]}>
        <boxGeometry args={[0.18, 4, 10]} />
        <meshStandardMaterial color="#111A15" />
      </mesh>

      {tables.map(([x, z], index) => <Table key={index} x={x} z={z} />)}

      <RoundedBox args={[3.2, 1.15, 1.05]} position={[4.2, 0.48, 2.8]} radius={0.12}>
        <meshStandardMaterial color="#2E2119" />
      </RoundedBox>
      <RoundedBox args={[4.8, 1, 1.1]} position={[3.5, 0.4, -3.25]} radius={0.12}>
        <meshStandardMaterial color="#46514B" metalness={0.45} />
      </RoundedBox>
      <RoundedBox args={[2.5, 1.8, 0.25]} position={[3.1, 1.85, -4.55]} radius={0.12}>
        <meshStandardMaterial color="#101813" emissive={scene === "kitchen" ? "#1D7C3D" : "#000000"} emissiveIntensity={scene === "kitchen" ? 0.9 : 0} />
      </RoundedBox>

      {[0, 1, 2].map((level) => (
        <mesh key={level} position={[-4.1, 0.55 + level * 0.75, -3.75]}>
          <boxGeometry args={[3, 0.08, 0.8]} />
          <meshStandardMaterial color="#46514B" metalness={0.5} />
        </mesh>
      ))}

      {["#F0DF9E", "#E06C4E", "#F6F0D0", "#E5B14F", "#85B65F", "#C77C4F"].map((color, index) => (
        <mesh key={color} position={[-5.1 + (index % 3) * 0.75, 0.85 + Math.floor(index / 3) * 0.75, -3.75]} scale={[1, scene === "inventory" ? 0.72 + (index % 3) * 0.12 : 1, 1]}>
          <cylinderGeometry args={[0.18, 0.18, 0.52, 18]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}

      {[-4, -2, 0, 2, 4].map((x) => <pointLight key={x} position={[x, 3.5, 1.1]} color="#FFBF76" intensity={3.8} distance={4} />)}
      <ProfitCore />
      <LeakParticles />
    </group>
  );
}
