"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Clone, Environment, Line, RoundedBox, Sparkles, useGLTF, useProgress } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience";

type V3 = [number, number, number];
type Rot = [number, number, number];

const RAW = "https://raw.githubusercontent.com/Teetertater/Floorplan2Walkthru/main/public/assets/furniture";
const HDRI = "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/warm_restaurant_1k.hdr";
const ASSET = {
  armchair: `${RAW}/ArmChair_01_1k.gltf/ArmChair_01_1k.gltf`,
  sofa: `${RAW}/sofa_02_1k.gltf/sofa_02_1k.gltf`,
  coffee: `${RAW}/modern_coffee_table_01_1k.gltf/modern_coffee_table_01_1k.gltf`,
  chair: `${RAW}/dining_chair_02_1k.gltf/dining_chair_02_1k.gltf`,
  roundTable: `${RAW}/round_wooden_table_01_1k.gltf/round_wooden_table_01_1k.gltf`,
  shelf: `${RAW}/steel_frame_shelves_01_1k.gltf/steel_frame_shelves_01_1k.gltf`,
  console: `${RAW}/ClassicConsole_01_1k.gltf/ClassicConsole_01_1k.gltf`,
  stool: `${RAW}/metal_stool_01_1k.gltf/metal_stool_01_1k.gltf`
};

export function World3D() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setSupported(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch {
      setSupported(false);
    }
  }, []);

  if (supported === false) return <div className="webgl-fallback" aria-hidden="true"/>;
  if (supported === null) return null;

  return <>
    <div className="world-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [-7, 2.1, 10], fov: 43, near: 0.1, far: 180 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
        shadows
      >
        <color attach="background" args={["#020403"]}/>
        <fog attach="fog" args={["#020403", 13, 34]}/>
        <ambientLight intensity={0.18}/>
        <Suspense fallback={null}>
          <Environment files={HDRI}/>
          <World/>
        </Suspense>
      </Canvas>
    </div>
    <AssetLoading/>
  </>;
}

function AssetLoading() {
  const { active, progress } = useProgress();
  return <div className={`asset-loading ${active ? "visible" : ""}`} aria-hidden={!active}>
    <span>Building the hospitality world</span>
    <b>{Math.round(progress)}%</b>
    <i><em style={{ width: `${progress}%` }}/></i>
  </div>;
}

function World() {
  return <>
    <CameraRig/>
    <HotelStage/>
    <RestaurantStage/>
    <KitchenStage/>
    <InventoryStage/>
    <CoreStage/>
    <OrderToken/>
    <DataPath/>
    <Sparkles count={150} scale={[95, 10, 20]} speed={0.05} size={0.65} opacity={0.14} color="#a8f36a"/>
  </>;
}

function CameraRig() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7, 2.2, 10.5),
    new THREE.Vector3(0, 2.05, 7.4),
    new THREE.Vector3(9, 2.5, 8.4),
    new THREE.Vector3(18, 2.05, 6.7),
    new THREE.Vector3(27, 2.55, 8.2),
    new THREE.Vector3(36, 2.2, 6.2),
    new THREE.Vector3(45, 2.5, 8.1),
    new THREE.Vector3(54, 2.15, 6.4),
    new THREE.Vector3(63, 2.15, 8.2),
    new THREE.Vector3(70, 1.85, 6.1),
    new THREE.Vector3(72, 1.4, 4.3)
  ], false, "catmullrom", 0.34), []);

  useFrame((state, delta) => {
    const { progress, pointerX, pointerY, reducedMotion } = useExperience.getState();
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    const pos = curve.getPointAt(p);
    const ahead = curve.getPointAt(Math.min(1, p + 0.025));
    const parallax = reducedMotion ? 0 : 0.32;
    pos.x += pointerX * parallax;
    pos.y += pointerY * parallax * 0.45;
    const lambda = reducedMotion ? 12 : 3.5;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, pos.x, lambda, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, pos.y, lambda, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, pos.z, lambda, delta);
    const target = ahead.clone();
    target.y = THREE.MathUtils.lerp(target.y, 1.25, 0.22);
    state.camera.lookAt(target);
  });
  return null;
}

function StageShell({ x, width = 11, depth = 9, accent = "#c38d4c" }: { x: number; width?: number; depth?: number; accent?: string }) {
  return <group position={[x, 0, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, depth]}/>
      <meshStandardMaterial color="#0a0d0b" metalness={0.28} roughness={0.34}/>
    </mesh>
    <mesh position={[0, 2.3, -depth / 2]} receiveShadow>
      <boxGeometry args={[width, 4.6, 0.18]}/>
      <meshStandardMaterial color="#090c0a" metalness={0.08} roughness={0.66}/>
    </mesh>
    {[-width / 2 + 0.7, width / 2 - 0.7].map((px) => <mesh key={px} position={[px, 2.3, -depth / 2 + 0.12]}>
      <boxGeometry args={[0.06, 3.8, 0.06]}/>
      <meshBasicMaterial color={accent} transparent opacity={0.48}/>
    </mesh>)}
  </group>;
}

function HotelStage() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const scene = useExperience.getState().scene;
    const target = scene === 0 ? 0 : -0.07;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target, 2.2, delta);
  });
  return <group ref={group}>
    <StageShell x={0} width={13} depth={10} accent="#e5a75a"/>
    <group position={[0, 0, 0]}>
      <AssetModel url={ASSET.sofa} position={[0, 0, -2.9]} rotation={[0, 0, 0]} scale={1.1}/>
      <AssetModel url={ASSET.armchair} position={[-2.7, 0, -1.2]} rotation={[0, 0.45, 0]} scale={1.04}/>
      <AssetModel url={ASSET.armchair} position={[2.7, 0, -1.2]} rotation={[0, -0.45, 0]} scale={1.04}/>
      <AssetModel url={ASSET.coffee} position={[0, 0, -0.85]} rotation={[0, 0, 0]} scale={1.05}/>
      <AssetModel url={ASSET.console} position={[4.25, 0, -3.6]} rotation={[0, -Math.PI / 2, 0]} scale={0.9}/>
      <mesh position={[0, 2.7, -4.82]}>
        <planeGeometry args={[5.7, 1.2]}/>
        <meshBasicMaterial color="#bc8a50" transparent opacity={0.06}/>
      </mesh>
      <spotLight position={[-3, 5.5, 2]} target-position={[0, 0, -1]} intensity={52} angle={0.5} penumbra={0.8} color="#ffc77c" castShadow/>
      <pointLight position={[3.5, 2.6, -1]} intensity={18} distance={8} color="#8effa2"/>
    </group>
  </group>;
}

function RestaurantStage() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const { scene, localProgress } = useExperience.getState();
    const lift = scene === 1 ? Math.sin(localProgress * Math.PI) * 0.06 : 0;
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, lift, 2.5, delta);
  });
  return <group ref={group} position={[18, 0, 0]}>
    <StageShell x={0} width={12} depth={9} accent="#a8f36a"/>
    <AssetModel url={ASSET.roundTable} position={[0, 0, -0.8]} rotation={[0, 0, 0]} scale={1.08}/>
    <AssetModel url={ASSET.chair} position={[0, 0, 1.45]} rotation={[0, Math.PI, 0]} scale={0.95}/>
    <AssetModel url={ASSET.chair} position={[0, 0, -3.15]} rotation={[0, 0, 0]} scale={0.95}/>
    <AssetModel url={ASSET.chair} position={[-2.25, 0, -0.8]} rotation={[0, Math.PI / 2, 0]} scale={0.95}/>
    <AssetModel url={ASSET.chair} position={[2.25, 0, -0.8]} rotation={[0, -Math.PI / 2, 0]} scale={0.95}/>
    {[[-2.5, 4.3, -1], [0, 4.4, -1.2], [2.5, 4.2, -1]] as V3[]}.map((p, i) => <group key={i} position={p}>
      <mesh><cylinderGeometry args={[0.34, 0.45, 0.26, 40]}/><meshStandardMaterial color="#161510" metalness={0.75} roughness={0.25}/></mesh>
      <pointLight position={[0, -0.4, 0]} intensity={16} distance={6} color="#ffc36b"/>
    </group>)}
    <spotLight position={[1, 5.2, 3]} intensity={48} angle={0.48} penumbra={0.75} color="#ffd79d" castShadow/>
  </group>;
}

function KitchenStage() {
  return <group position={[36, 0, 0]}>
    <StageShell x={0} width={13} depth={10} accent="#e9a34c"/>
    <AssetModel url={ASSET.shelf} position={[-4.3, 0, -3.8]} rotation={[0, 0, 0]} scale={1.1}/>
    <AssetModel url={ASSET.shelf} position={[4.1, 0, -3.8]} rotation={[0, 0, 0]} scale={1.1}/>
    <RoundedBox args={[6.5, 1.05, 1.9]} radius={0.08} smoothness={4} position={[0, 0.55, -1]} castShadow>
      <meshStandardMaterial color="#303632" metalness={0.9} roughness={0.2}/>
    </RoundedBox>
    <RoundedBox args={[4.7, 0.22, 1.7]} radius={0.07} smoothness={4} position={[0, 1.2, -1]}>
      <meshStandardMaterial color="#6f726d" metalness={0.92} roughness={0.16}/>
    </RoundedBox>
    <AssetModel url={ASSET.stool} position={[-2.6, 0, 1.2]} rotation={[0, 0.25, 0]} scale={1}/>
    <IngredientCloud/>
    <spotLight position={[0, 5.4, 2.5]} intensity={55} angle={0.5} penumbra={0.78} color="#fff0d0" castShadow/>
    <pointLight position={[4.2, 2.4, -2]} intensity={20} distance={7} color="#e9a34c"/>
  </group>;
}

function IngredientCloud() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const { scene, localProgress, reducedMotion } = useExperience.getState();
    const active = scene === 3 ? Math.sin(localProgress * Math.PI) : scene === 2 ? 0.25 : 0;
    group.current.visible = active > 0.02;
    const target = 0.4 + active * 0.7;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, target, 3, delta));
    if (!reducedMotion) group.current.rotation.y += delta * 0.16;
  });
  const colors = ["#e9d4b0", "#d94f37", "#83ad58", "#f2d27d", "#b36f39", "#e7e1c8", "#8d3f28"];
  return <group ref={group} position={[0, 2.6, -0.6]}>
    {colors.map((color, index) => {
      const angle = (index / colors.length) * Math.PI * 2;
      const r = 1.45 + (index % 2) * 0.45;
      return <mesh key={color} position={[Math.cos(angle) * r, Math.sin(angle * 1.3) * 0.65, Math.sin(angle) * 0.85]}>
        <icosahedronGeometry args={[0.18 + (index % 3) * 0.05, 2]}/>
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.06}/>
      </mesh>;
    })}
  </group>;
}

function InventoryStage() {
  return <group position={[54, 0, 0]}>
    <StageShell x={0} width={13} depth={10} accent="#73d990"/>
    <AssetModel url={ASSET.shelf} position={[-3.7, 0, -3.7]} rotation={[0, 0, 0]} scale={1.18}/>
    <AssetModel url={ASSET.shelf} position={[0, 0, -3.7]} rotation={[0, 0, 0]} scale={1.18}/>
    <AssetModel url={ASSET.shelf} position={[3.7, 0, -3.7]} rotation={[0, 0, 0]} scale={1.18}/>
    <StockCrates/>
    <spotLight position={[-2, 5.4, 2.8]} intensity={46} angle={0.52} penumbra={0.8} color="#d9ffe2" castShadow/>
    <pointLight position={[4.6, 2.8, -1]} intensity={16} distance={8} color="#65ff89"/>
  </group>;
}

function StockCrates() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const { scene, localProgress } = useExperience.getState();
    const warning = scene === 4 ? Math.sin(localProgress * Math.PI) : 0;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, warning * -0.05, 2, delta);
  });
  return <group ref={group}>
    {Array.from({ length: 8 }).map((_, index) => {
      const x = -3.4 + (index % 4) * 2.2;
      const z = 0.4 + Math.floor(index / 4) * 1.7;
      return <RoundedBox key={index} args={[1.35, 0.78, 1]} radius={0.08} smoothness={4} position={[x, 0.42, z]} castShadow>
        <meshStandardMaterial color={index === 6 ? "#48211c" : "#242b26"} emissive={index === 6 ? "#ff594d" : "#17311f"} emissiveIntensity={index === 6 ? 0.7 : 0.18} roughness={0.52}/>
      </RoundedBox>;
    })}
  </group>;
}

function CoreStage() {
  const root = useRef<THREE.Group>(null);
  const rings = useRef<Array<THREE.Mesh | null>>([]);
  const core = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    const { scene, localProgress, reducedMotion } = useExperience.getState();
    if (root.current && !reducedMotion) root.current.rotation.y += delta * (scene >= 5 ? 0.18 : 0.05);
    const leak = scene === 5 ? Math.sin(localProgress * Math.PI) : 0;
    const assembled = scene >= 6 ? 1 : 0.78;
    if (root.current) root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, assembled, 2.8, delta));
    rings.current.forEach((ring, index) => {
      if (!ring) return;
      const targetX = leak * (index - 1.5) * 0.42;
      const targetY = leak * Math.sin(index * 1.8) * 0.45;
      ring.position.x = THREE.MathUtils.damp(ring.position.x, targetX, 3, delta);
      ring.position.y = THREE.MathUtils.damp(ring.position.y, targetY, 3, delta);
      if (!reducedMotion) ring.rotation.z += delta * (0.08 + index * 0.03) * (index % 2 ? 1 : -1);
    });
    if (core.current) {
      const danger = scene === 5;
      core.current.color.set(danger ? "#6d1712" : "#143d21");
      core.current.emissive.set(danger ? "#ff3e31" : "#74ff8f");
      core.current.emissiveIntensity = danger ? 2.4 : 1.65;
    }
  });

  return <group position={[72, 1.45, 0]} ref={root}>
    <mesh>
      <sphereGeometry args={[1.55, 96, 96]}/>
      <meshPhysicalMaterial color="#0b120e" transmission={0.72} thickness={2.2} roughness={0.09} metalness={0.18} clearcoat={1} clearcoatRoughness={0.08}/>
    </mesh>
    <mesh>
      <icosahedronGeometry args={[0.68, 5]}/>
      <meshStandardMaterial ref={core} color="#143d21" emissive="#74ff8f" emissiveIntensity={1.65} metalness={0.32} roughness={0.14}/>
    </mesh>
    {[1.95, 2.45, 2.95, 3.5].map((radius, index) => <mesh key={radius} ref={(node) => { rings.current[index] = node; }} rotation={[index * 0.72, index * 0.46, index * 0.58]}>
      <torusGeometry args={[radius, 0.025 + index * 0.006, 16, 180]}/>
      <meshStandardMaterial color={index === 2 ? "#e9a34c" : "#a8f36a"} emissive={index === 2 ? "#e9a34c" : "#62ff83"} emissiveIntensity={1.15} metalness={0.55} roughness={0.2} transparent opacity={0.68 - index * 0.08}/>
    </mesh>)}
    <pointLight intensity={38} distance={11} color="#6dff8a"/>
    <Sparkles count={70} scale={[8, 8, 8]} speed={0.12} size={1.05} opacity={0.34} color="#a8f36a"/>
  </group>;
}

function OrderToken() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const { progress, reducedMotion } = useExperience.getState();
    const t = THREE.MathUtils.clamp((progress - 0.13) / 0.30, 0, 1);
    const smooth = t * t * (3 - 2 * t);
    ref.current.position.set(18 + smooth * 18, 2.4 + Math.sin(smooth * Math.PI) * 1.7, 0.3 - smooth * 0.7);
    ref.current.rotation.y = -0.45 + smooth * 0.9;
    if (!reducedMotion) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.3) * 0.05;
    const visible = progress > 0.1 && progress < 0.48;
    ref.current.scale.setScalar(visible ? 1 : 0.001);
  });
  return <group ref={ref}>
    <RoundedBox args={[1.15, 0.72, 0.08]} radius={0.08} smoothness={5}>
      <meshStandardMaterial color="#0f1c13" emissive="#65ff89" emissiveIntensity={0.75} metalness={0.4} roughness={0.22}/>
    </RoundedBox>
    <mesh position={[0, 0, 0.055]}><planeGeometry args={[0.62, 0.055]}/><meshBasicMaterial color="#c8ffac"/></mesh>
    <mesh position={[0, -0.14, 0.055]}><planeGeometry args={[0.82, 0.035]}/><meshBasicMaterial color="#7a9e7f"/></mesh>
  </group>;
}

function DataPath() {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(18, 1.1, 0.8),
    new THREE.Vector3(27, 1.8, -1),
    new THREE.Vector3(36, 1.25, -0.2),
    new THREE.Vector3(45, 1.65, 0.7),
    new THREE.Vector3(54, 1.15, 0),
    new THREE.Vector3(63, 1.8, -0.7),
    new THREE.Vector3(72, 1.45, 0)
  ], false, "catmullrom", 0.32), []);
  const points = useMemo(() => curve.getPoints(90).map((p) => [p.x, p.y, p.z] as V3), [curve]);
  const pulses = useRef<Array<THREE.Mesh | null>>([]);

  useFrame((state) => {
    const scene = useExperience.getState().scene;
    pulses.current.forEach((node, index) => {
      if (!node) return;
      const speed = scene === 5 ? 0.035 : 0.06;
      const t = (state.clock.elapsedTime * speed + index / 11) % 1;
      const p = curve.getPointAt(t);
      node.position.copy(p);
    });
  });

  return <group>
    <Line points={points} color="#76ff93" transparent opacity={0.24} lineWidth={0.6}/>
    {Array.from({ length: 11 }).map((_, index) => <mesh key={index} ref={(node) => { pulses.current[index] = node; }}>
      <sphereGeometry args={[0.045, 14, 14]}/>
      <meshBasicMaterial color={index % 4 === 0 ? "#e9a34c" : "#9bffad"}/>
    </mesh>)}
  </group>;
}

function AssetModel({ url, position, rotation = [0, 0, 0], scale = 1 }: { url: string; position: V3; rotation?: Rot; scale?: number }) {
  const gltf = useGLTF(url) as unknown as { scene: THREE.Object3D };
  return <Clone object={gltf.scene} position={position} rotation={rotation} scale={scale} castShadow receiveShadow/>;
}
