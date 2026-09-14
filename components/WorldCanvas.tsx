"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience";

export function WorldCanvas() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setSupported(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch {
      setSupported(false);
    }
  }, []);

  if (supported === false) return <div className="world-fallback" aria-hidden="true"/>;
  if (supported === null) return null;

  return <div className="world-layer" aria-hidden="true">
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.15, 7.4], fov: 38, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.22}/>
      <directionalLight position={[4, 5, 6]} intensity={2.2} color="#fff1d4"/>
      <pointLight position={[-4, 0, 3]} intensity={22} distance={10} color="#3eff7a"/>
      <pointLight position={[4, -1, 1]} intensity={14} distance={9} color="#e9a34c"/>
      <SceneRig/>
      <MunaffaCore/>
      <SignalStreams/>
      <Sparkles count={95} scale={[12, 7, 8]} speed={0.08} size={1.15} opacity={0.26} color="#a8f36a"/>
    </Canvas>
  </div>;
}

function SceneRig() {
  useFrame((state, delta) => {
    const { progress, scene } = useExperience.getState();
    const targetX = THREE.MathUtils.lerp(1.8, scene >= 7 ? 0 : 2.35, Math.min(1, progress * 1.8));
    const targetY = Math.sin(progress * Math.PI * 2) * 0.22 + (scene === 8 ? 0.15 : 0);
    const targetZ = scene >= 7 ? 5.2 : 6.8 - progress * 0.85;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2.4, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2.4, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2.4, delta);
    state.camera.lookAt(scene >= 7 ? 0 : 1.35, 0, 0);
  });
  return null;
}

function MunaffaCore() {
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const shellPoints = useMemo(() => [
    new THREE.Vector2(0.18, -0.94),
    new THREE.Vector2(0.66, -0.86),
    new THREE.Vector2(1.02, -0.58),
    new THREE.Vector2(1.15, -0.08),
    new THREE.Vector2(1.04, 0.43),
    new THREE.Vector2(0.72, 0.78),
    new THREE.Vector2(0.32, 0.98),
    new THREE.Vector2(0.06, 1.02)
  ], []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const { progress, scene, localProgress } = useExperience.getState();
    group.current.rotation.y += delta * (0.12 + Math.max(0, scene - 6) * 0.025);
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.24) * 0.06;
    const takeover = THREE.MathUtils.smoothstep(scene, 5.5, 8.2);
    const targetScale = 0.72 + takeover * 0.58 + (scene === 7 ? Math.sin(localProgress * Math.PI) * 0.09 : 0);
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, targetScale, 3, delta));
    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, scene >= 7 ? 0 : 2.25, 2.5, delta);
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, scene === 12 ? 0.2 : 0, 2.5, delta);
    if (glow.current) {
      const leaking = scene === 7;
      glow.current.emissive.set(leaking ? "#ff594d" : "#78ff8e");
      glow.current.color.set(leaking ? "#7a1610" : "#0e351d");
      glow.current.emissiveIntensity = 1.6 + Math.sin(state.clock.elapsedTime * 1.8) * 0.35 + progress * 0.6;
    }
  });

  return <group ref={group} position={[2.25, 0, 0]}>
    <mesh castShadow receiveShadow>
      <latheGeometry args={[shellPoints, 96]}/>
      <meshPhysicalMaterial color="#111813" metalness={0.78} roughness={0.2} clearcoat={1} clearcoatRoughness={0.16} transmission={0.06} thickness={1.6} side={THREE.DoubleSide}/>
    </mesh>
    <mesh position={[0, -0.86, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.72, 0.09, 24, 96]}/>
      <meshStandardMaterial color="#1c2a20" metalness={0.9} roughness={0.18}/>
    </mesh>
    <mesh position={[0, -0.02, 0]}>
      <icosahedronGeometry args={[0.54, 5]}/>
      <meshStandardMaterial ref={glow} color="#0e351d" emissive="#78ff8e" emissiveIntensity={2} metalness={0.25} roughness={0.16}/>
    </mesh>
    <mesh rotation={[Math.PI / 2, 0.3, 0]}>
      <torusGeometry args={[1.38, 0.018, 12, 160]}/>
      <meshBasicMaterial color="#a8f36a" transparent opacity={0.48}/>
    </mesh>
    <mesh rotation={[1.1, 0.1, 0.55]}>
      <torusGeometry args={[1.72, 0.012, 12, 160]}/>
      <meshBasicMaterial color="#e9a34c" transparent opacity={0.3}/>
    </mesh>
    <mesh rotation={[0.35, 0.7, 1.2]}>
      <torusGeometry args={[2.05, 0.009, 12, 160]}/>
      <meshBasicMaterial color="#8af5a3" transparent opacity={0.18}/>
    </mesh>
    <OrbitNodes/>
  </group>;
}

function OrbitNodes() {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  useFrame((state) => {
    refs.current.forEach((node, index) => {
      if (!node) return;
      const t = state.clock.elapsedTime * (0.32 + index * 0.012) + index * 0.9;
      const radius = 1.45 + (index % 2) * 0.5;
      node.position.set(Math.cos(t) * radius, Math.sin(t * 0.74) * 0.72, Math.sin(t) * radius * 0.45);
    });
  });

  return <>{Array.from({ length: 7 }).map((_, index) => <mesh key={index} ref={(node) => { refs.current[index] = node; }}>
    <sphereGeometry args={[0.045 + (index % 3) * 0.012, 18, 18]}/>
    <meshBasicMaterial color={index === 5 ? "#e9a34c" : "#a8f36a"}/>
  </mesh>)}</>;
}

function SignalStreams() {
  const scene = useExperience((state) => state.scene);
  const opacity = scene < 2 ? 0.06 : scene < 7 ? 0.2 : 0.42;
  return <group>
    <Line points={[[-6, 1.4, -1], [-2.8, 0.8, 0], [0, 0.2, 0], [2.6, -0.2, 0]]} color="#a8f36a" transparent opacity={opacity} lineWidth={0.55}/>
    <Line points={[[-5, -1.9, -2], [-2.1, -0.7, 0.2], [0.2, 0.05, 0], [2.3, 0.3, 0.1]]} color={scene === 7 ? "#ff594d" : "#e9a34c"} transparent opacity={opacity * 0.72} lineWidth={0.38}/>
    <Line points={[[-3.6, 2.5, -3], [-1.4, 1.2, -0.6], [0.4, 0.15, 0], [2.4, 0.05, 0]]} color="#78ff8e" transparent opacity={opacity * 0.55} lineWidth={0.3}/>
  </group>;
}
