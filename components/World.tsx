"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Clone, Environment, Line, RoundedBox, Sparkles, useGLTF, useProgress } from "@react-three/drei";
import { Component, type ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/store";

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

class Boundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}

export function World() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setSupported(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch {
      setSupported(false);
    }
  }, []);

  if (supported === false) return <div className="webgl-fallback" aria-hidden="true"><i/><b>3D fallback mode</b></div>;
  if (supported === null) return null;

  return <>
    <Boundary fallback={<div className="webgl-fallback" aria-hidden="true"><i/><b>3D fallback mode</b></div>}>
      <div className="world-layer" aria-hidden="true">
        <Canvas
          dpr={[1, 1.65]}
          camera={{ position: [-8, 2.4, 12], fov: 44, near: 0.08, far: 220 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
          shadows
        >
          <color attach="background" args={["#020403"]}/>
          <fog attach="fog" args={["#020403", 15, 42]}/>
          <ambientLight intensity={0.13}/>
          <hemisphereLight intensity={0.18} color="#bcd7c4" groundColor="#050705"/>
          <Boundary fallback={null}><Suspense fallback={null}><Environment files={HDRI}/></Suspense></Boundary>
          <WorldScene/>
        </Canvas>
      </div>
    </Boundary>
    <LoadingOverlay/>
  </>;
}

function LoadingOverlay() {
  const { active, progress } = useProgress();
  const [seen, setSeen] = useState(false);
  useEffect(() => { if (active) setSeen(true); }, [active]);
  return <div className={`loading-overlay ${active || !seen ? "visible" : ""}`} aria-hidden={!active}>
    <div className="loading-mark">M</div>
    <span>ASSEMBLING THE HOSPITALITY WORLD</span>
    <strong>{Math.round(progress)}%</strong>
    <i><em style={{ width: `${progress}%` }}/></i>
  </div>;
}

function WorldScene() {
  const scene = useExperience((state) => state.scene);
  return <>
    <CameraRig/>
    <DataFloor/>
    <StageLighting scene={scene}/>
    <Boundary fallback={<StageFallback x={0}/>}> <Suspense fallback={null}><HotelStage/></Suspense> </Boundary>
    <Boundary fallback={<StageFallback x={16}/>}> <Suspense fallback={null}><RestaurantStage/></Suspense> </Boundary>
    <Boundary fallback={<StageFallback x={32}/>}> <Suspense fallback={null}><KitchenStage/></Suspense> </Boundary>
    <RecipeStage/>
    <Boundary fallback={<StageFallback x={64}/>}> <Suspense fallback={null}><InventoryStage/></Suspense> </Boundary>
    <PaymentStage/>
    <ProfitCore position={[96, 1.7, 0]}/>
    <IndustryStage/>
    <IntelligenceStage/>
    <FinalBeacon/>
    <OrderSignal/>
    <DataNetwork/>
    <Sparkles count={180} scale={[170, 12, 22]} speed={0.045} size={0.58} opacity={0.13} color="#9ef38d"/>
    {scene === 6 && <Sparkles count={95} scale={[15, 9, 12]} position={[96, 1.7, 0]} speed={0.6} size={2.3} opacity={0.72} color="#ff5d4f"/>}
  </>;
}

function CameraRig() {
  const cameraCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8, 2.45, 12),
    new THREE.Vector3(0, 2.2, 8.1),
    new THREE.Vector3(16, 1.95, 7.4),
    new THREE.Vector3(32, 2.25, 7.1),
    new THREE.Vector3(48, 2.9, 7.8),
    new THREE.Vector3(64, 2.15, 7.2),
    new THREE.Vector3(80, 2.15, 6.4),
    new THREE.Vector3(94, 2.0, 7.2),
    new THREE.Vector3(99, 1.65, 5.2),
    new THREE.Vector3(112, 2.45, 8.3),
    new THREE.Vector3(128, 2.2, 7.1),
    new THREE.Vector3(144, 1.65, 5.6)
  ], false, "catmullrom", 0.34), []);

  const targetCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.1, -1.3),
    new THREE.Vector3(4, 1.2, -1.0),
    new THREE.Vector3(16, 1.0, -0.8),
    new THREE.Vector3(32, 1.1, -0.9),
    new THREE.Vector3(48, 1.3, -0.4),
    new THREE.Vector3(64, 1.1, -1.0),
    new THREE.Vector3(80, 1.2, -0.3),
    new THREE.Vector3(96, 1.65, 0),
    new THREE.Vector3(100, 1.65, 0),
    new THREE.Vector3(112, 1.5, 0),
    new THREE.Vector3(128, 1.7, 0),
    new THREE.Vector3(144, 1.7, 0)
  ], false, "catmullrom", 0.32), []);

  useFrame((state, delta) => {
    const { progress, pointerX, pointerY, velocity, reducedMotion } = useExperience.getState();
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    const desired = cameraCurve.getPointAt(p);
    const look = targetCurve.getPointAt(p);
    const parallax = reducedMotion ? 0 : 0.38;
    desired.x += pointerX * parallax;
    desired.y += pointerY * parallax * 0.55;
    const lambda = reducedMotion ? 14 : 4.0;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, desired.x, lambda, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, desired.y, lambda, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, desired.z, lambda, delta);
    state.camera.lookAt(look);
    if (state.camera instanceof THREE.PerspectiveCamera) {
      const speed = Math.min(1, Math.abs(velocity) / 4200);
      state.camera.fov = THREE.MathUtils.damp(state.camera.fov, 44 + speed * 4.5, 4, delta);
      state.camera.updateProjectionMatrix();
      if (!reducedMotion) state.camera.rotation.z += THREE.MathUtils.clamp(-velocity / 110000, -0.035, 0.035);
    }
  });
  return null;
}

function DataFloor() {
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color("#7dff95") },
    uAmber: { value: new THREE.Color("#e8a44d") }
  }), []);
  useFrame(({ clock }) => { if (material.current) material.current.uniforms.uTime.value = clock.elapsedTime; });
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[72, -0.035, 0]}>
    <planeGeometry args={[170, 18]}/>
    <shaderMaterial
      ref={material}
      uniforms={uniforms}
      transparent
      depthWrite={false}
      vertexShader={`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
      fragmentShader={`varying vec2 vUv; uniform float uTime; uniform vec3 uColor; uniform vec3 uAmber; void main(){ vec2 g=abs(fract(vUv*vec2(85.0,9.0))-0.5); float line=1.0-smoothstep(0.47,0.5,max(g.x,g.y)); float pulse=0.35+0.65*sin(vUv.x*48.0-uTime*1.8)*0.5+0.5; float center=1.0-smoothstep(0.0,0.48,abs(vUv.y-0.5)); vec3 c=mix(uAmber,uColor,vUv.x); float a=(line*0.12+pulse*0.025)*center; gl_FragColor=vec4(c,a);}`}
    />
  </mesh>;
}

function StageLighting({ scene }: { scene: number }) {
  const green = scene === 6 ? "#ff5d4f" : "#82ff9b";
  return <>
    <directionalLight position={[10, 12, 8]} intensity={1.8} color="#ffe4ba" castShadow shadow-mapSize={[1024, 1024]}/>
    <pointLight position={[96, 5, 3]} intensity={scene >= 6 && scene <= 7 ? 52 : 10} distance={18} color={green}/>
    <pointLight position={[80, 3, -2]} intensity={20} distance={12} color="#e8a44d"/>
  </>;
}

function Platform({ x, width = 12, depth = 9, accent = "#a8f36a" }: { x: number; width?: number; depth?: number; accent?: string }) {
  return <group position={[x, 0, 0]}>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]}/>
      <meshStandardMaterial color="#0a0d0b" metalness={0.34} roughness={0.3}/>
    </mesh>
    <mesh receiveShadow position={[0, 2.35, -depth / 2]}>
      <boxGeometry args={[width, 4.7, 0.16]}/>
      <meshStandardMaterial color="#080b09" roughness={0.62}/>
    </mesh>
    {[-width / 2 + 0.5, width / 2 - 0.5].map((px) => <mesh key={px} position={[px, 2.2, -depth / 2 + 0.12]}>
      <boxGeometry args={[0.045, 3.8, 0.045]}/><meshBasicMaterial color={accent} transparent opacity={0.46}/>
    </mesh>)}
  </group>;
}

function StageFallback({ x }: { x: number }) {
  return <group position={[x, 1.5, 0]}><mesh><octahedronGeometry args={[1.1, 1]}/><meshBasicMaterial color="#7dff95" wireframe transparent opacity={0.22}/></mesh></group>;
}

function Model({ url, position, rotation = [0, 0, 0], scale = 1 }: { url: string; position: V3; rotation?: Rot; scale?: number | V3 }) {
  const { scene } = useGLTF(url);
  return <Clone object={scene} position={position} rotation={rotation} scale={scale}/>;
}

function HotelStage() {
  return <group>
    <Platform x={0} width={13} depth={10} accent="#e9a34c"/>
    <Model url={ASSET.sofa} position={[0, 0, -2.8]} scale={1.08}/>
    <Model url={ASSET.armchair} position={[-2.8, 0, -1.0]} rotation={[0, 0.5, 0]} scale={1.02}/>
    <Model url={ASSET.armchair} position={[2.8, 0, -1.0]} rotation={[0, -0.5, 0]} scale={1.02}/>
    <Model url={ASSET.coffee} position={[0, 0, -0.75]} scale={1.02}/>
    <Model url={ASSET.console} position={[4.4, 0, -3.65]} rotation={[0, -Math.PI / 2, 0]} scale={0.9}/>
    <spotLight position={[-3.5, 5.2, 2]} intensity={42} angle={0.5} penumbra={0.8} color="#ffc67c" castShadow/>
    <pointLight position={[3.5, 2.8, -1.2]} intensity={18} distance={8} color="#82ff9b"/>
  </group>;
}

function RestaurantStage() {
  return <group position={[16, 0, 0]}>
    <Platform x={0} width={12} depth={9}/>
    <Model url={ASSET.roundTable} position={[0, 0, -0.8]} scale={1.08}/>
    <Model url={ASSET.chair} position={[0, 0, 1.5]} rotation={[0, Math.PI, 0]} scale={0.95}/>
    <Model url={ASSET.chair} position={[0, 0, -3.0]} scale={0.95}/>
    <Model url={ASSET.chair} position={[-2.25, 0, -0.8]} rotation={[0, Math.PI / 2, 0]} scale={0.95}/>
    <Model url={ASSET.chair} position={[2.25, 0, -0.8]} rotation={[0, -Math.PI / 2, 0]} scale={0.95}/>
    {([[-2.5, 4.2, -1], [0, 4.4, -1.2], [2.5, 4.2, -1]] as V3[]).map((p, i) => <group key={i} position={p}>
      <mesh><cylinderGeometry args={[0.34, 0.45, 0.26, 40]}/><meshStandardMaterial color="#17150f" metalness={0.8} roughness={0.22}/></mesh>
      <pointLight position={[0, -0.5, 0]} intensity={15} distance={5.5} color="#ffc66d"/>
    </group>)}
  </group>;
}

function KitchenStage() {
  return <group position={[32, 0, 0]}>
    <Platform x={0} width={13} depth={10} accent="#e9a34c"/>
    <Model url={ASSET.shelf} position={[-4.2, 0, -3.8]} scale={1.1}/>
    <Model url={ASSET.shelf} position={[4.1, 0, -3.8]} scale={1.1}/>
    <RoundedBox args={[6.4, 1.0, 1.9]} radius={0.08} smoothness={4} position={[0, 0.55, -0.8]} castShadow>
      <meshStandardMaterial color="#303632" metalness={0.92} roughness={0.18}/>
    </RoundedBox>
    <RoundedBox args={[4.6, 0.2, 1.7]} radius={0.07} smoothness={4} position={[0, 1.16, -0.8]}>
      <meshStandardMaterial color="#777a75" metalness={0.94} roughness={0.12}/>
    </RoundedBox>
    <Model url={ASSET.stool} position={[-2.7, 0, 1.15]} rotation={[0, 0.25, 0]}/>
    <Model url={ASSET.stool} position={[2.7, 0, 1.15]} rotation={[0, -0.25, 0]}/>
    <spotLight position={[0, 5.5, 2.2]} intensity={48} angle={0.52} penumbra={0.78} color="#fff0d0" castShadow/>
  </group>;
}

function RecipeStage() {
  const fragments = useRef<Array<THREE.Mesh | null>>([]);
  const offsets = useMemo<V3[]>(() => [[-2.2,1.2,0.3],[2.1,1.0,-0.2],[-1.7,-0.7,0.8],[1.9,-0.8,0.6],[-0.4,1.9,-0.5],[0.6,-1.7,-0.4],[2.8,0.2,0.2]], []);
  useFrame((_, delta) => {
    const { scene, local } = useExperience.getState();
    const explode = scene < 3 ? 0 : scene === 3 ? local : 1;
    fragments.current.forEach((mesh, index) => {
      if (!mesh) return;
      const offset = offsets[index];
      mesh.position.x = THREE.MathUtils.damp(mesh.position.x, offset[0] * explode, 4, delta);
      mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 1.65 + offset[1] * explode, 4, delta);
      mesh.position.z = THREE.MathUtils.damp(mesh.position.z, offset[2] * explode, 4, delta);
      mesh.rotation.x += delta * (0.15 + index * 0.02);
      mesh.rotation.y += delta * (0.2 + index * 0.025);
    });
  });
  const colors = ["#f1e0ba","#cf493b","#75a755","#f1cf6d","#b46b34","#ebe5ce","#8d392c"];
  return <group position={[48, 0, 0]}>
    <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[2.25, 2.45, 0.15, 96]}/><meshPhysicalMaterial color="#d8d6cf" metalness={0.08} roughness={0.2} clearcoat={1}/></mesh>
    <mesh position={[0, 0.63, 0]}><cylinderGeometry args={[1.35, 1.6, 0.22, 64]}/><meshStandardMaterial color="#8c482f" roughness={0.55}/></mesh>
    {colors.map((color, index) => <mesh key={color} ref={(node) => { fragments.current[index] = node; }} position={[0, 1.65, 0]} castShadow>
      <icosahedronGeometry args={[0.23 + (index % 3) * 0.06, 2]}/><meshStandardMaterial color={color} roughness={0.42}/>
    </mesh>)}
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 1.6, 0]}><torusGeometry args={[3.35, 0.015, 12, 160]}/><meshBasicMaterial color="#e9a34c" transparent opacity={0.35}/></mesh>
    <pointLight position={[0, 4.5, 2]} intensity={34} distance={9} color="#fff0cd"/>
  </group>;
}

function InventoryStage() {
  const variance = useRef<Array<THREE.Mesh | null>>([]);
  useFrame((state, delta) => {
    const { scene, local } = useExperience.getState();
    const active = scene === 4 ? local : scene > 4 ? 1 : 0;
    variance.current.forEach((mesh, index) => {
      if (!mesh) return;
      const t = active * (1 + index * 0.05);
      mesh.position.y = THREE.MathUtils.damp(mesh.position.y, 0.6 + t * (0.8 + index * 0.08), 4, delta);
      mesh.position.x = THREE.MathUtils.damp(mesh.position.x, 2.4 + index * 0.25 * active, 4, delta);
      mesh.rotation.y += delta * 0.35;
      mesh.scale.setScalar(0.75 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.04);
    });
  });
  return <group position={[64, 0, 0]}>
    <Platform x={0} width={13} depth={10} accent="#78d990"/>
    <Model url={ASSET.shelf} position={[-3.8, 0, -3.7]} scale={1.18}/>
    <Model url={ASSET.shelf} position={[0, 0, -3.7]} scale={1.18}/>
    <Model url={ASSET.shelf} position={[3.8, 0, -3.7]} scale={1.18}/>
    {Array.from({ length: 10 }).map((_, i) => <RoundedBox key={i} args={[0.72,0.52,0.72]} radius={0.05} smoothness={3} position={[-2.7 + (i%5)*1.35,0.32,0.5+Math.floor(i/5)*1.1]}>
      <meshStandardMaterial color={i < 7 ? "#66513b" : "#405b45"} roughness={0.55}/>
    </RoundedBox>)}
    {Array.from({ length: 5 }).map((_, i) => <mesh key={i} ref={(node) => { variance.current[i] = node; }} position={[2.4 + i*0.18,0.6,1.8]}>
      <boxGeometry args={[0.18,0.18,0.18]}/><meshStandardMaterial color="#ff5d4f" emissive="#ff3328" emissiveIntensity={1.8}/>
    </mesh>)}
    <pointLight position={[2.8, 2.6, 1.8]} intensity={18} distance={7} color="#ff5d4f"/>
  </group>;
}

function PaymentStage() {
  const coins = useRef<Array<THREE.Mesh | null>>([]);
  useFrame((_, delta) => {
    const { scene, local } = useExperience.getState();
    const move = scene < 5 ? 0 : scene === 5 ? local : 1;
    coins.current.forEach((coin, index) => {
      if (!coin) return;
      coin.position.x = THREE.MathUtils.damp(coin.position.x, -1.8 + move * (3.3 + index * 0.16), 4, delta);
      coin.position.y = THREE.MathUtils.damp(coin.position.y, 1.3 + Math.sin(move * Math.PI + index) * 0.35, 4, delta);
      coin.rotation.y += delta * 1.4;
    });
  });
  return <group position={[80, 0, 0]}>
    <RoundedBox args={[3.5, 2.1, 0.34]} radius={0.22} smoothness={5} position={[0, 1.45, 0]} castShadow>
      <meshPhysicalMaterial color="#151b17" metalness={0.7} roughness={0.18} clearcoat={1}/>
    </RoundedBox>
    <RoundedBox args={[2.65, 1.25, 0.12]} radius={0.12} smoothness={4} position={[0, 1.5, 0.24]}>
      <meshPhysicalMaterial color="#14351e" emissive="#59ff7a" emissiveIntensity={0.55} roughness={0.22}/>
    </RoundedBox>
    {Array.from({ length: 7 }).map((_, i) => <mesh key={i} ref={(node) => { coins.current[i] = node; }} position={[-1.8 - i*0.12,1.3,0.8]} rotation={[Math.PI/2,0,0]}>
      <cylinderGeometry args={[0.18,0.18,0.055,40]}/><meshStandardMaterial color="#d8b35e" metalness={0.9} roughness={0.16} emissive="#9b6d1d" emissiveIntensity={0.3}/>
    </mesh>)}
    <pointLight position={[0, 2, 2.5]} intensity={25} distance={8} color="#8aff9e"/>
  </group>;
}

function ProfitCore({ position }: { position: V3 }) {
  const pieceRefs = useRef<Array<THREE.Group | null>>([]);
  const materialRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const dirs = useMemo<V3[]>(() => [[1,0.4,0.2],[-1,0.35,0.3],[0.45,1,-0.2],[-0.5,-1,0.2],[0.2,0.35,1],[-0.25,-0.3,-1]], []);
  useFrame((state, delta) => {
    const { scene, local } = useExperience.getState();
    const explosion = scene < 6 ? 0 : scene === 6 ? local : scene === 7 ? 1 - local : 0;
    pieceRefs.current.forEach((piece, index) => {
      if (!piece) return;
      const dir = dirs[index];
      const amount = explosion * 2.9;
      piece.position.x = THREE.MathUtils.damp(piece.position.x, dir[0] * amount, 5, delta);
      piece.position.y = THREE.MathUtils.damp(piece.position.y, dir[1] * amount, 5, delta);
      piece.position.z = THREE.MathUtils.damp(piece.position.z, dir[2] * amount, 5, delta);
      piece.rotation.x += delta * (0.08 + index * 0.015 + explosion * 0.35);
      piece.rotation.y += delta * (0.12 + index * 0.02 + explosion * 0.4);
    });
    materialRefs.current.forEach((mat) => {
      if (!mat) return;
      mat.color.lerp(new THREE.Color(explosion > 0.08 ? "#5e1712" : "#15391f"), 0.09);
      mat.emissive.lerp(new THREE.Color(explosion > 0.08 ? "#ff392f" : "#62ff82"), 0.1);
      mat.emissiveIntensity = 1.1 + explosion * 1.7 + Math.sin(state.clock.elapsedTime * 2.2) * 0.18;
    });
    if (ringA.current) ringA.current.rotation.z += delta * (0.22 + explosion * 0.7);
    if (ringB.current) ringB.current.rotation.x += delta * (0.18 + explosion * 0.55);
  });

  return <group position={position}>
    <mesh><icosahedronGeometry args={[0.78,5]}/><meshPhysicalMaterial color="#142f1c" metalness={0.32} roughness={0.14} clearcoat={1} transmission={0.08}/></mesh>
    {dirs.map((_, index) => <group key={index} ref={(node) => { pieceRefs.current[index] = node; }} rotation={[0, index*Math.PI/3, index*0.15]}>
      <RoundedBox args={[1.1,0.42,0.66]} radius={0.18} smoothness={5} position={[1.25,0,0]}>
        <meshStandardMaterial ref={(mat) => { materialRefs.current[index] = mat; }} color="#15391f" emissive="#62ff82" emissiveIntensity={1.2} metalness={0.72} roughness={0.2}/>
      </RoundedBox>
    </group>)}
    <mesh ref={ringA} rotation={[Math.PI/2,0,0]}><torusGeometry args={[2.15,0.028,18,160]}/><meshBasicMaterial color="#a8f36a" transparent opacity={0.72}/></mesh>
    <mesh ref={ringB} rotation={[0.8,0.2,0.5]}><torusGeometry args={[2.75,0.018,16,180]}/><meshBasicMaterial color="#e9a34c" transparent opacity={0.42}/></mesh>
    <pointLight position={[0,0,1.3]} intensity={28} distance={9} color="#76ff8e"/>
  </group>;
}

function IndustryStage() {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const { scene, local, reducedMotion } = useExperience.getState();
    if (!group.current) return;
    const target = scene === 8 ? -0.24 + local * 0.48 : 0;
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target, 3, delta);
    if (!reducedMotion) group.current.rotation.z = Math.sin(performance.now()*0.0002)*0.012;
  });
  const colors = ["#a8f36a","#e9a34c","#82d9ff","#e3c5ff","#f4d56c","#77e6ad"];
  return <group ref={group} position={[112,1.8,0]}>
    {colors.map((color,index) => {
      const angle = (index / colors.length) * Math.PI * 2;
      return <group key={color} position={[Math.cos(angle)*3.4, Math.sin(angle)*1.55, Math.sin(angle)*1.3]} rotation={[0, -angle*0.28, 0]}>
        <mesh rotation={[0,Math.PI/2,0]}><torusGeometry args={[0.92,0.055,20,90]}/><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} metalness={0.7} roughness={0.2}/></mesh>
        <mesh position={[0,0,-0.08]}><circleGeometry args={[0.78,64]}/><meshBasicMaterial color={color} transparent opacity={0.045}/></mesh>
      </group>;
    })}
    <pointLight intensity={30} distance={10} color="#92ff9f"/>
  </group>;
}

function IntelligenceStage() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    const { scene, local } = useExperience.getState();
    const target = scene === 9 ? 1 + local * 0.08 : 0.92;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, target, 4, delta));
    group.current.position.y = 1.6 + Math.sin(state.clock.elapsedTime * 0.7) * 0.06;
  });
  return <group ref={group} position={[128,1.6,0]}>
    {[-2.5,0,2.5].map((x,index) => <group key={x} position={[x,index===1?0.35:0,0]}>
      <RoundedBox args={[2.0,3.2,0.22]} radius={0.18} smoothness={5}>
        <meshPhysicalMaterial color="#101712" metalness={0.55} roughness={0.18} transparent opacity={0.88} transmission={0.08} clearcoat={1}/>
      </RoundedBox>
      {Array.from({length:6}).map((_,i) => <mesh key={i} position={[-0.62+i*0.25,-0.75+(i%2)*0.12,0.18]}>
        <boxGeometry args={[0.12,0.35+i*0.12,0.04]}/><meshBasicMaterial color={index===1?"#a8f36a":"#e9a34c"} transparent opacity={0.72}/>
      </mesh>)}
      <mesh position={[0,0.82,0.18]}><planeGeometry args={[1.45,0.05]}/><meshBasicMaterial color="#ffffff" transparent opacity={0.16}/></mesh>
    </group>)}
    <Line points={[[-2.5,0,0],[0,0.35,0],[2.5,0,0]]} color="#a8f36a" transparent opacity={0.5} lineWidth={0.6}/>
  </group>;
}

function FinalBeacon() {
  const group = useRef<THREE.Group>(null);
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
    const { scene, local } = useExperience.getState();
    const scale = scene === 10 ? 0.85 + local * 0.2 : 0.76;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, scale, 4, delta));
    group.current.position.y = 1.7 + Math.sin(state.clock.elapsedTime * 0.75)*0.08;
  });
  return <group ref={group} position={[144,1.7,0]}>
    <mesh><icosahedronGeometry args={[1.0,6]}/><meshPhysicalMaterial color="#16391f" emissive="#63ff84" emissiveIntensity={1.8} metalness={0.42} roughness={0.12} clearcoat={1}/></mesh>
    {[1.7,2.35,3.0].map((r,i) => <mesh key={r} rotation={[Math.PI/2-i*0.28,i*0.33,0]}><torusGeometry args={[r,0.018,14,150]}/><meshBasicMaterial color={i===1?"#e9a34c":"#a8f36a"} transparent opacity={0.48-i*0.1}/></mesh>)}
    <pointLight intensity={45} distance={13} color="#76ff8e"/>
  </group>;
}

function OrderSignal() {
  const head = useRef<THREE.Mesh>(null);
  const trails = useRef<Array<THREE.Mesh | null>>([]);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(16,1.4,-0.7),
    new THREE.Vector3(20,2.4,-0.1),
    new THREE.Vector3(25,2.0,1.2),
    new THREE.Vector3(28.5,2.8,0.1),
    new THREE.Vector3(32,1.45,-0.5),
    new THREE.Vector3(38,2.1,0.4),
    new THREE.Vector3(48,1.55,0)
  ], false, "catmullrom", 0.3), []);
  useFrame((_, delta) => {
    const { scene, local } = useExperience.getState();
    let phase = 0;
    let visible = true;
    if (scene < 1) visible = false;
    else if (scene === 1) phase = local * 0.38;
    else if (scene === 2) phase = 0.38 + local * 0.34;
    else if (scene === 3) phase = 0.72 + local * 0.28;
    else { phase = 1; visible = false; }
    if (head.current) {
      head.current.visible = visible;
      const p = curve.getPointAt(phase);
      head.current.position.lerp(p, 1 - Math.exp(-delta*12));
    }
    trails.current.forEach((trail,index) => {
      if (!trail) return;
      trail.visible = visible;
      const tp = Math.max(0, phase - 0.025*(index+1));
      trail.position.copy(curve.getPointAt(tp));
      trail.scale.setScalar(1-index*0.08);
    });
  });
  return <group>
    <Line points={curve.getPoints(90).map((p)=>[p.x,p.y,p.z] as V3)} color="#83ff99" transparent opacity={0.13} lineWidth={0.35}/>
    <mesh ref={head}><sphereGeometry args={[0.16,28,28]}/><meshStandardMaterial color="#caffbd" emissive="#53ff72" emissiveIntensity={3}/></mesh>
    {Array.from({length:7}).map((_,i)=><mesh key={i} ref={(node)=>{trails.current[i]=node;}}><sphereGeometry args={[0.095,20,20]}/><meshBasicMaterial color="#7dff95" transparent opacity={0.5-i*0.05}/></mesh>)}
  </group>;
}

function DataNetwork() {
  const scene = useExperience((state) => state.scene);
  const green = scene === 6 ? "#ff5d4f" : "#7dff95";
  const points: V3[] = [[0,0.08,2.8],[16,0.08,2.4],[32,0.08,2.0],[48,0.08,1.4],[64,0.08,1.0],[80,0.08,0.6],[96,0.08,0],[112,0.08,-0.4],[128,0.08,-0.7],[144,0.08,0]];
  return <>
    <Line points={points} color={green} transparent opacity={0.38} lineWidth={0.75}/>
    <Line points={points.map(([x,y,z])=>[x,y+0.03,z-1.1] as V3)} color="#e9a34c" transparent opacity={0.16} lineWidth={0.35}/>
  </>;
}
