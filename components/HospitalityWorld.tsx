"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Sparkles, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience";

const RAW = "https://raw.githubusercontent.com/Teetertater/Floorplan2Walkthru/main/public/assets/furniture";
const assets = {
  armchair: `${RAW}/ArmChair_01_1k.gltf/ArmChair_01_1k.gltf`,
  sofa: `${RAW}/sofa_02_1k.gltf/sofa_02_1k.gltf`,
  coffeeTable: `${RAW}/modern_coffee_table_01_1k.gltf/modern_coffee_table_01_1k.gltf`,
  diningChair: `${RAW}/dining_chair_02_1k.gltf/dining_chair_02_1k.gltf`,
  diningTable: `${RAW}/round_wooden_table_01_1k.gltf/round_wooden_table_01_1k.gltf`,
  shelves: `${RAW}/steel_frame_shelves_01_1k.gltf/steel_frame_shelves_01_1k.gltf`,
  console: `${RAW}/ClassicConsole_01_1k.gltf/ClassicConsole_01_1k.gltf`,
  stool: `${RAW}/metal_stool_01_1k.gltf/metal_stool_01_1k.gltf`,
};

function RealAsset({ url, position, rotation = [0, 0, 0], scale = 1 }: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const gltf = useGLTF(url);
  const clone = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return <primitive object={clone} position={position} rotation={rotation} scale={scale} />;
}

function LuxuryHotelStage() {
  return <group position={[0, 0, 0]}>
    <RealAsset url={assets.sofa} position={[-1.4, 0, 0.4]} rotation={[0, 0.35, 0]} scale={1.2} />
    <RealAsset url={assets.armchair} position={[1.7, 0, 0.2]} rotation={[0, -0.9, 0]} scale={1.05} />
    <RealAsset url={assets.coffeeTable} position={[0.25, 0, 1.25]} scale={1.25} />
    <RealAsset url={assets.console} position={[-2.9, 0, -1.6]} rotation={[0, 0.25, 0]} scale={1.05} />
    <pointLight position={[-1, 3, 1]} intensity={14} color="#ffb55e" distance={9} />
  </group>;
}

function RestaurantStage() {
  const chairs: [number, number, number][] = [[-1.3,0,.1],[1.3,Math.PI,.1],[0,Math.PI/2,-1.3],[0,-Math.PI/2,1.3]];
  return <group position={[15, 0, 0]}>
    <RealAsset url={assets.diningTable} position={[0, 0, 0]} scale={1.05} />
    {chairs.map(([x, r, z], i) => <RealAsset key={i} url={assets.diningChair} position={[x, 0, z]} rotation={[0, r, 0]} scale={1.02} />)}
    <RealAsset url={assets.console} position={[3.2, 0, -1.8]} rotation={[0, -1.3, 0]} scale={1} />
    <pointLight position={[0, 3.2, 0]} intensity={18} color="#ffc47a" distance={10} />
  </group>;
}

function CafeStage() {
  return <group position={[30, 0, 0]}>
    <RealAsset url={assets.diningTable} position={[0, 0, 0]} scale={0.8} />
    <RealAsset url={assets.stool} position={[-1.05, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={1} />
    <RealAsset url={assets.stool} position={[1.05, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={1} />
    <RealAsset url={assets.armchair} position={[2.8, 0, -1]} rotation={[0, -1, 0]} scale={0.9} />
    <pointLight position={[0, 3, 0]} intensity={14} color="#ffad5c" distance={9} />
  </group>;
}

function OperationsStage() {
  const scene = useExperience((s) => s.scene);
  const progress = useExperience((s) => s.localProgress);
  const shelvesScale = scene === "problem" ? 1 + progress * 0.16 : 1;
  return <group position={[45, 0, 0]}>
    <group scale={[shelvesScale, 1, shelvesScale]}>
      <RealAsset url={assets.shelves} position={[-1.7, 0, -0.3]} scale={1.25} />
      <RealAsset url={assets.shelves} position={[1.5, 0, -0.3]} rotation={[0, Math.PI, 0]} scale={1.25} />
    </group>
    <RealAsset url={assets.console} position={[0, 0, 1.8]} rotation={[0, Math.PI, 0]} scale={1.1} />
    <pointLight position={[0, 3.2, 0]} intensity={14} color={scene === "problem" ? "#ff5e55" : "#9eff76"} distance={10} />
  </group>;
}

function ProfitCore() {
  const ref = useRef<THREE.Group>(null);
  const scene = useExperience((s) => s.scene);
  const visible = ["platform", "intelligence", "proof", "final"].includes(scene);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.35; });
  return <group ref={ref} visible={visible} position={[60, 1.8, 0]}>
    <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.35}>
      <mesh><icosahedronGeometry args={[1.1, 4]} /><meshPhysicalMaterial color="#9dfc73" emissive="#2ca64d" emissiveIntensity={1.2} roughness={0.18} transmission={0.08} clearcoat={1} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.6, 0.035, 16, 120]} /><meshBasicMaterial color="#b9ff8f" transparent opacity={0.9} /></mesh>
      <mesh rotation={[0.7, 0.4, 0.2]}><torusGeometry args={[1.9, 0.018, 16, 120]} /><meshBasicMaterial color="#53df75" transparent opacity={0.45} /></mesh>
    </Float>
    <pointLight color="#8dff73" intensity={34} distance={13} />
    <Sparkles count={50} scale={5} size={2} speed={0.3} color="#baff98" />
  </group>;
}

function CameraRig() {
  const progress = useExperience((s) => s.progress);
  const reduced = useExperience((s) => s.reducedMotion);
  const look = useRef(new THREE.Vector3());
  useFrame(({ camera, pointer }) => {
    const x = THREE.MathUtils.lerp(1.5, 60, progress);
    const wave = Math.sin(progress * Math.PI * 5);
    camera.position.lerp(new THREE.Vector3(x, 4.8 + wave * 0.5, 8.8 - progress * 1.2), reduced ? 0.16 : 0.045);
    look.current.set(x + 1.2, 1.3, 0);
    if (!reduced) { look.current.x += pointer.x * 0.35; look.current.y += pointer.y * 0.18; }
    camera.lookAt(look.current);
  });
  return null;
}

function SceneContent() {
  return <>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[30, -0.03, 0]} receiveShadow><planeGeometry args={[80, 18]} /><meshStandardMaterial color="#101712" roughness={0.86} metalness={0.06} /></mesh>
    <LuxuryHotelStage /><RestaurantStage /><CafeStage /><OperationsStage /><ProfitCore />
    <ContactShadows position={[30, 0.01, 0]} opacity={0.65} scale={76} blur={2.5} far={14} />
  </>;
}

export function HospitalityWorld() {
  return <div className="world-shell" aria-hidden="true"><Canvas shadows dpr={[1, 1.5]} camera={{ position: [1.5, 5, 9], fov: 42, near: 0.1, far: 120 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
    <color attach="background" args={["#07100b"]} /><fogExp2 attach="fog" args={["#07100b", 0.018]} /><hemisphereLight intensity={0.72} color="#c9fbd0" groundColor="#2a160d" /><directionalLight position={[-6, 9, 5]} intensity={2.6} color="#ffe0b0" castShadow />
    <Suspense fallback={null}><Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/warm_restaurant_1k.hdr" /><SceneContent /></Suspense><CameraRig />
  </Canvas></div>;
}

Object.values(assets).forEach((url) => useGLTF.preload(url));
