"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Sparkles, useGLTF } from "@react-three/drei";
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience";

const RAW = "https://raw.githubusercontent.com/Teetertater/Floorplan2Walkthru/main/public/assets/furniture";
const assets = {
  armchair: `${RAW}/ArmChair_01_1k.gltf/ArmChair_01_1k.gltf`,
  modernChair: `${RAW}/modern_arm_chair_01_1k.gltf/modern_arm_chair_01_1k.gltf`,
  sofa: `${RAW}/sofa_02_1k.gltf/sofa_02_1k.gltf`,
  sofaAlt: `${RAW}/sofa_03_1k.gltf/sofa_03_1k.gltf`,
  coffeeTable: `${RAW}/modern_coffee_table_01_1k.gltf/modern_coffee_table_01_1k.gltf`,
  sideTable: `${RAW}/side_table_01_1k.gltf/side_table_01_1k.gltf`,
  diningChair: `${RAW}/dining_chair_02_1k.gltf/dining_chair_02_1k.gltf`,
  diningTable: `${RAW}/round_wooden_table_01_1k.gltf/round_wooden_table_01_1k.gltf`,
  shelves: `${RAW}/steel_frame_shelves_01_1k.gltf/steel_frame_shelves_01_1k.gltf`,
  displayShelves: `${RAW}/wooden_display_shelves_01_1k.gltf/wooden_display_shelves_01_1k.gltf`,
  console: `${RAW}/ClassicConsole_01_1k.gltf/ClassicConsole_01_1k.gltf`,
  stool: `${RAW}/metal_stool_01_1k.gltf/metal_stool_01_1k.gltf`,
  officeDesk: `${RAW}/metal_office_desk_1k.gltf/metal_office_desk_1k.gltf`,
};

type Quality = "high" | "low";

class WorldErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") console.error("Munaffa 3D world failed", error, info);
  }
  render() {
    if (this.state.failed) return <WorldFallback />;
    return this.props.children;
  }
}

function WorldFallback() {
  return <div className="world-fallback" aria-hidden="true"><div className="fallback-halo"/><div className="fallback-building"><i/><i/><i/><i/><i/></div></div>;
}

function RealAsset({ url, position, rotation = [0, 0, 0], scale = 1 }: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const gltf = useGLTF(url);
  const clone = useMemo(() => {
    const next = gltf.scene.clone(true);
    next.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return next;
  }, [gltf.scene]);
  return <primitive object={clone} position={position} rotation={rotation} scale={scale} />;
}

function RoomEnvelope({ position, width = 11, depth = 7.5, tone = "#141d17", accent = "#9df56f" }: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  tone?: string;
  accent?: string;
}) {
  const [x, y, z] = position;
  return <group position={[x, y, z]}>
    <mesh position={[0, -0.07, 0]} receiveShadow><boxGeometry args={[width, 0.14, depth]} /><meshStandardMaterial color="#171b18" roughness={0.62} metalness={0.08} /></mesh>
    <mesh position={[0, 2.35, -depth / 2]} receiveShadow><boxGeometry args={[width, 4.7, 0.16]} /><meshStandardMaterial color={tone} roughness={0.82} /></mesh>
    <mesh position={[-width / 2 + 0.14, 2.35, -0.8]}><boxGeometry args={[0.28, 4.7, depth - 1.4]} /><meshStandardMaterial color="#202820" roughness={0.72} /></mesh>
    <mesh position={[width / 2 - 0.14, 2.35, -0.8]}><boxGeometry args={[0.28, 4.7, depth - 1.4]} /><meshStandardMaterial color="#202820" roughness={0.72} /></mesh>
    <mesh position={[0, 4.65, -1.1]}><boxGeometry args={[width, 0.12, depth - 1]} /><meshStandardMaterial color="#111713" roughness={0.76} /></mesh>
    {[-0.32, 0.32].map((offset) => <mesh key={offset} position={[0, 4.53, offset - 1]}><boxGeometry args={[width * 0.82, 0.035, 0.035]} /><meshBasicMaterial color={accent} transparent opacity={0.38} /></mesh>)}
    {[-3.2, 0, 3.2].map((offset) => <mesh key={offset} position={[offset, 2.35, -depth / 2 + 0.1]}><boxGeometry args={[0.04, 3.5, 0.035]} /><meshBasicMaterial color={accent} transparent opacity={0.2} /></mesh>)}
  </group>;
}

function SoftPanel({ position, size = [1.8, 0.95], color = "#9df56f" }: { position: [number, number, number]; size?: [number, number]; color?: string }) {
  return <group position={position}>
    <mesh><boxGeometry args={[size[0], size[1], 0.045]} /><meshPhysicalMaterial color="#08120c" roughness={0.28} metalness={0.42} clearcoat={0.55} /></mesh>
    <mesh position={[0, 0, 0.03]}><planeGeometry args={[size[0] * 0.86, size[1] * 0.76]} /><meshBasicMaterial color={color} transparent opacity={0.13} /></mesh>
    {[0.22, 0, -0.22].map((y, i) => <mesh key={i} position={[-size[0] * 0.12, y, 0.058]}><boxGeometry args={[size[0] * (0.42 + i * 0.08), 0.026, 0.018]} /><meshBasicMaterial color={color} transparent opacity={0.5 - i * 0.09} /></mesh>)}
  </group>;
}

function HotelLobbyStage() {
  return <group position={[0, 0, 0]}><RoomEnvelope position={[0, 0, 0]} tone="#1c211c" accent="#c8ffad" /><RealAsset url={assets.sofa} position={[-1.7, 0, -0.2]} rotation={[0, 0.28, 0]} scale={1.24} /><RealAsset url={assets.modernChair} position={[1.55, 0, 0.25]} rotation={[0, -0.72, 0]} scale={0.9} /><RealAsset url={assets.armchair} position={[2.75, 0, -1.25]} rotation={[0, -1.2, 0]} scale={0.88} /><RealAsset url={assets.coffeeTable} position={[0.15, 0, 1]} scale={1.15} /><RealAsset url={assets.sideTable} position={[-3.25, 0, -0.55]} scale={0.88} /><RealAsset url={assets.console} position={[3.6, 0, -2.55]} rotation={[0, Math.PI, 0]} scale={0.92} /><SoftPanel position={[2.9, 2.55, -3.66]} size={[2.7, 1.25]} color="#b6ff8d" /><pointLight position={[-2.2, 2.8, 1.3]} intensity={18} color="#ffbf72" distance={9} /><spotLight position={[3.2, 4.25, 1.4]} intensity={35} color="#ffe2b6" angle={0.48} penumbra={0.8} distance={11} /></group>;
}

function RestaurantStage() {
  const tables = [-2.65, 0, 2.65];
  return <group position={[14, 0, -0.45]}><RoomEnvelope position={[0, 0, 0]} width={12} depth={8} tone="#231b15" accent="#ffb45e" />{tables.map((x, tableIndex) => <group key={x} position={[x, 0, 0]}><RealAsset url={assets.diningTable} position={[0, 0, 0]} scale={0.8} /><RealAsset url={assets.diningChair} position={[-1.05, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.88} /><RealAsset url={assets.diningChair} position={[1.05, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.88} />{tableIndex === 1 && <><RealAsset url={assets.diningChair} position={[0, 0, -1.05]} rotation={[0, 0, 0]} scale={0.88} /><RealAsset url={assets.diningChair} position={[0, 0, 1.05]} rotation={[0, Math.PI, 0]} scale={0.88} /></>}<pointLight position={[0, 3.2, 0]} intensity={11} color="#ffb970" distance={5.5} /><mesh position={[0, 3.65, 0]}><cylinderGeometry args={[0.34, 0.52, 0.22, 32]} /><meshStandardMaterial color="#1d1713" roughness={0.38} metalness={0.55} /></mesh><mesh position={[0, 3.43, 0]}><sphereGeometry args={[0.08, 18, 18]} /><meshBasicMaterial color="#ffd19a" /></mesh></group>)}<RealAsset url={assets.console} position={[3.8, 0, -2.75]} rotation={[0, Math.PI, 0]} scale={1.08} /><RealAsset url={assets.stool} position={[2.9, 0, -1.75]} rotation={[0, 0.18, 0]} scale={0.9} /><RealAsset url={assets.stool} position={[4.2, 0, -1.75]} rotation={[0, -0.15, 0]} scale={0.9} /><SoftPanel position={[-3.4, 2.5, -3.91]} size={[2.4, 1.05]} color="#ffb45e" /></group>;
}

function CafeStage() {
  return <group position={[28, 0, 0.35]}><RoomEnvelope position={[0, 0, 0]} width={11.5} depth={7.6} tone="#17211b" accent="#8eff84" /><RealAsset url={assets.officeDesk} position={[2.75, 0, -2.45]} rotation={[0, Math.PI, 0]} scale={0.78} /><RealAsset url={assets.displayShelves} position={[4.25, 0, -2.7]} rotation={[0, Math.PI, 0]} scale={1.05} /><RealAsset url={assets.diningTable} position={[-1.6, 0, 0.25]} scale={0.72} /><RealAsset url={assets.stool} position={[-2.55, 0, 0.25]} rotation={[0, Math.PI / 2, 0]} scale={0.9} /><RealAsset url={assets.stool} position={[-0.65, 0, 0.25]} rotation={[0, -Math.PI / 2, 0]} scale={0.9} /><RealAsset url={assets.sofaAlt} position={[1.05, 0, 1.15]} rotation={[0, -0.55, 0]} scale={0.88} /><RealAsset url={assets.sideTable} position={[2.7, 0, 1.5]} scale={0.78} /><SoftPanel position={[0, 2.55, -3.71]} size={[3.15, 1.22]} color="#87f885" /><pointLight position={[-1.2, 3.2, 0.4]} intensity={15} color="#ffc178" distance={7.5} /><pointLight position={[3.4, 2.4, -1.8]} intensity={9} color="#8eff84" distance={6} /></group>;
}

function OperationsStage() {
  const scene = useExperience((s) => s.scene);
  const progress = useExperience((s) => s.localProgress);
  const stress = scene === "problem" ? 1 + progress * 0.06 : 1;
  return <group position={[42, 0, -0.1]} scale={[stress, 1, stress]}><RoomEnvelope position={[0, 0, 0]} width={12} depth={8} tone="#151b18" accent={scene === "problem" ? "#ff675f" : "#9df56f"} /><RealAsset url={assets.shelves} position={[-3.45, 0, -2.55]} scale={1.15} /><RealAsset url={assets.shelves} position={[-1.3, 0, -2.55]} scale={1.15} /><RealAsset url={assets.displayShelves} position={[1.4, 0, -2.6]} rotation={[0, Math.PI, 0]} scale={1.05} /><RealAsset url={assets.officeDesk} position={[3.7, 0, -2.25]} rotation={[0, Math.PI, 0]} scale={0.82} /><RealAsset url={assets.console} position={[0.7, 0, 1.75]} rotation={[0, Math.PI, 0]} scale={0.95} /><SoftPanel position={[3.35, 2.45, -3.91]} size={[2.65, 1.15]} color={scene === "problem" ? "#ff675f" : "#9df56f"} /><SoftPanel position={[0.25, 2.45, -3.91]} size={[2.35, 1.15]} color="#ffb45e" />{[-2.3, -1.6, -0.9].map((x, i) => <mesh key={x} position={[x, 0.38, 1.8 + i * 0.12]} castShadow><boxGeometry args={[0.72, 0.76, 0.72]} /><meshStandardMaterial color={i === 1 ? "#5c3c2b" : "#6c5136"} roughness={0.88} /></mesh>)}<pointLight position={[0, 3.3, 0]} intensity={scene === "problem" ? 18 : 12} color={scene === "problem" ? "#ff675f" : "#b7ff94"} distance={9} /></group>;
}

function FlowOrb({ offset, curve }: { offset: number; curve: THREE.CatmullRomCurve3 }) {
  const ref = useRef<THREE.Mesh>(null);
  const scene = useExperience((s) => s.scene);
  const reduced = useExperience((s) => s.reducedMotion);
  const active = ["platform", "industries", "intelligence", "proof", "final"].includes(scene);
  useFrame(({ clock }) => { if (!ref.current) return; const t = reduced ? offset : (clock.elapsedTime * 0.045 + offset) % 1; ref.current.position.copy(curve.getPointAt(t)); ref.current.visible = active; });
  return <mesh ref={ref}><sphereGeometry args={[0.075, 14, 14]} /><meshStandardMaterial color="#baff94" emissive="#55dc74" emissiveIntensity={3.4} roughness={0.2} /></mesh>;
}

function SignalStream({ quality }: { quality: Quality }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(9,1.15,1.2),new THREE.Vector3(15,1.4,.8),new THREE.Vector3(24,1.05,1.35),new THREE.Vector3(32,1.55,.75),new THREE.Vector3(42,1.2,1.1),new THREE.Vector3(50,1.65,.5),new THREE.Vector3(57,2.05,0)]), []);
  const count = quality === "low" ? 8 : 18;
  return <group>{Array.from({ length: count }, (_, index) => <FlowOrb key={index} offset={index / count} curve={curve} />)}</group>;
}

function LeakageParticle({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const scene = useExperience((s) => s.scene);
  const reduced = useExperience((s) => s.reducedMotion);
  const seed = useMemo(() => ({ x: 12.2 + (index % 5) * 0.65, z: -0.8 + ((index * 7) % 9) * 0.22, speed: 0.32 + (index % 4) * 0.08 }), [index]);
  useFrame(({ clock }) => { if (!ref.current) return; ref.current.visible = scene === "problem"; const t = reduced ? 0.35 : (clock.elapsedTime * seed.speed + index * 0.13) % 1; ref.current.position.set(seed.x, 1.8 - t * 2.2, seed.z + t * 0.4); });
  return <mesh ref={ref}><sphereGeometry args={[0.055, 12, 12]} /><meshBasicMaterial color="#ff675f" /></mesh>;
}

function ProfitCommandStage({ quality }: { quality: Quality }) {
  const ref = useRef<THREE.Group>(null);
  const scene = useExperience((s) => s.scene);
  const reduced = useExperience((s) => s.reducedMotion);
  const visible = ["intelligence", "proof", "final"].includes(scene);
  useFrame((_, delta) => { if (ref.current && !reduced) ref.current.rotation.y += delta * 0.11; });
  return <group position={[57, 0, 0]}><RoomEnvelope position={[0, 0, 0]} width={12.5} depth={8.5} tone="#0b1510" accent="#9df56f" /><group visible={visible}><SoftPanel position={[-3.15, 2.55, -4.16]} size={[2.55, 1.3]} color="#9df56f" /><SoftPanel position={[0, 2.85, -4.16]} size={[3.05, 1.55]} color="#ffb45e" /><SoftPanel position={[3.2, 2.55, -4.16]} size={[2.55, 1.3]} color="#8bdcff" /><group ref={ref} position={[0, 1.72, 0]}><Float speed={1.15} rotationIntensity={0.18} floatIntensity={0.28}><mesh castShadow><icosahedronGeometry args={[1.05, quality === "low" ? 2 : 5]} /><meshPhysicalMaterial color="#a7ff7e" emissive="#2ea755" emissiveIntensity={1.25} roughness={0.15} metalness={0.18} transmission={0.08} clearcoat={1} /></mesh>{[1.5,1.85,2.2].map((radius,index)=><mesh key={radius} rotation={[Math.PI/(2+index),index*.8,index*.35]}><torusGeometry args={[radius,index===0?.035:.018,14,quality === "low" ? 48 : 100]} /><meshBasicMaterial color={index===1?"#ffb45e":"#aaff88"} transparent opacity={.75-index*.16} /></mesh>)}</Float></group>{quality === "high" && <Sparkles count={65} scale={[6.5,4.5,5]} size={1.7} speed={.24} color="#bdff9d" />}<pointLight color="#86ff73" intensity={30} distance={12} position={[0,2,0]} /></group></group>;
}

function CameraRig() {
  const progress = useExperience((s) => s.progress);
  const reduced = useExperience((s) => s.reducedMotion);
  const look = useRef(new THREE.Vector3());
  const cameraCurve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(-2.8,4.6,10.4),new THREE.Vector3(3.2,3.8,8.7),new THREE.Vector3(13.2,3.55,8.1),new THREE.Vector3(27.5,3.35,7.7),new THREE.Vector3(41.2,3.55,8.15),new THREE.Vector3(55.4,3.85,8.6),new THREE.Vector3(60.2,4.5,10.2)]), []);
  const targetCurve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.45,0),new THREE.Vector3(5,1.35,0),new THREE.Vector3(14,1.35,-.35),new THREE.Vector3(28,1.35,.25),new THREE.Vector3(42,1.45,0),new THREE.Vector3(57,1.8,0),new THREE.Vector3(57,1.9,0)]), []);
  useFrame(({ camera, pointer }) => { const t = THREE.MathUtils.clamp(progress,0,1); const targetPosition = cameraCurve.getPointAt(t); const targetLook = targetCurve.getPointAt(t); if (!reduced) { targetPosition.x += pointer.x*.16; targetPosition.y += pointer.y*.12; targetLook.x += pointer.x*.22; targetLook.y += pointer.y*.1; } camera.position.lerp(targetPosition,reduced?.16:.055); look.current.lerp(targetLook,reduced?.2:.08); camera.lookAt(look.current); });
  return null;
}

function SceneContent({ quality }: { quality: Quality }) {
  const leakageCount = quality === "low" ? 6 : 16;
  return <><HotelLobbyStage/><RestaurantStage/><CafeStage/><OperationsStage/><ProfitCommandStage quality={quality}/><SignalStream quality={quality}/>{Array.from({length:leakageCount},(_,index)=><LeakageParticle key={index} index={index}/>)}{quality === "high" && <ContactShadows position={[28,.02,0]} opacity={.72} scale={72} blur={2.8} far={16}/>}</>;
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function HospitalityWorld() {
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [quality, setQuality] = useState<Quality>("high");

  useEffect(() => {
    setWebgl(supportsWebGL());
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    setQuality(mobile || cores <= 4 || (typeof memory === "number" && memory <= 4) ? "low" : "high");
  }, []);

  if (webgl === false) return <WorldFallback />;
  if (webgl === null) return <div className="world-shell world-loading" aria-hidden="true" />;

  return <WorldErrorBoundary><div className={`world-shell quality-${quality}`} aria-hidden="true"><Canvas shadows={quality === "high"} dpr={quality === "low" ? [0.75,1] : [1,1.55]} camera={{position:[-2.8,4.6,10.4],fov:41,near:.1,far:130}} gl={{antialias:quality === "high",powerPreference:"high-performance"}}><color attach="background" args={["#050b08"]}/><fogExp2 attach="fog" args={["#050b08",.014]}/><hemisphereLight intensity={.68} color="#d5f8d7" groundColor="#27150d"/><directionalLight position={[-5,10,7]} intensity={2.3} color="#ffe0b2" castShadow={quality === "high"} shadow-mapSize-width={1024} shadow-mapSize-height={1024}/><Suspense fallback={null}><Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/warm_restaurant_1k.hdr" environmentIntensity={.45}/><SceneContent quality={quality}/></Suspense><CameraRig/></Canvas></div></WorldErrorBoundary>;
}
