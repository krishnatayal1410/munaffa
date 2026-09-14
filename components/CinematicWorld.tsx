"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Sparkles, useProgress, useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience";

const PORTALS = [
  { label: "Arrival", url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1920&h=1080&q=90" },
  { label: "Heritage", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&h=1080&q=90" },
  { label: "Dining", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&h=1080&q=90" },
  { label: "Culinary", url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1920&h=1080&q=90" },
  { label: "Coffee", url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1920&h=1080&q=90" },
  { label: "Kitchen", url: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1920&h=1080&q=90" },
  { label: "Inventory", url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1920&h=1080&q=90" },
  { label: "Resort", url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1920&h=1080&q=90" },
  { label: "Connected", url: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=1920&h=1080&q=90" }
] as const;

const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=700&h=900&q=90",
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&h=900&q=90",
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&h=900&q=90"
];

export function CinematicWorld() {
  const [webgl, setWebgl] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      setWebgl(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    } catch {
      setWebgl(false);
    }
  }, []);

  if (webgl === false) return <div className="world-fallback" aria-hidden="true"/>;
  if (webgl === null) return null;

  return <>
    <div className="world-canvas" aria-hidden="true">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.25, 6], fov: 43, near: 0.1, far: 180 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={["#030303"]}/>
        <fog attach="fog" args={["#030303", 15, 44]}/>
        <ambientLight intensity={0.22}/>
        <directionalLight position={[4, 7, 6]} intensity={1.4} color="#fff1dc"/>
        <Suspense fallback={null}>
          <Environment preset="warehouse" environmentIntensity={0.28}/>
          <World/>
        </Suspense>
      </Canvas>
    </div>
    <AssetProgress/>
  </>;
}

function World() {
  return <>
    <CameraRig/>
    {PORTALS.map((portal, index) => <Portal key={portal.label} index={index} {...portal}/>)}
    <ProductGallery/>
    <DataRibbon/>
    <Sparkles count={120} scale={[17, 8, 118]} position={[0, 0, -54]} speed={0.05} size={0.7} opacity={0.14} color="#e6b65d"/>
  </>;
}

function CameraRig() {
  const route = useMemo(() => new THREE.CatmullRomCurve3(PORTALS.map((_, index) => new THREE.Vector3(
    index % 3 === 1 ? 0.65 : index % 3 === 2 ? -0.48 : 0,
    index % 2 ? 0.18 : 0.05,
    6 - index * 14
  )), false, "catmullrom", 0.34), []);

  useFrame((state, delta) => {
    const { progress, pointerX, pointerY, velocity, reducedMotion } = useExperience.getState();
    const p = THREE.MathUtils.clamp(progress, 0, 1);
    const target = route.getPointAt(p);
    const look = route.getPointAt(Math.min(1, p + 0.022));
    const parallax = reducedMotion ? 0 : 0.26;
    target.x += pointerX * parallax;
    target.y += pointerY * parallax * 0.42;
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, target.x, reducedMotion ? 9 : 4, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, target.y, reducedMotion ? 9 : 4, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, target.z, reducedMotion ? 9 : 4, delta);
    look.y += pointerY * 0.08;
    state.camera.lookAt(look);
    const perspective = state.camera as THREE.PerspectiveCamera;
    const speedFov = reducedMotion ? 43 : 43 + Math.min(5, Math.abs(velocity) / 950);
    perspective.fov = THREE.MathUtils.damp(perspective.fov, speedFov, 5, delta);
    perspective.updateProjectionMatrix();
  });
  return null;
}

function Portal({ index, url }: { index: number; label: string; url: string }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const texture = useTexture(url);
  const z = -index * 14;
  const x = index % 3 === 1 ? 0.65 : index % 3 === 2 ? -0.48 : 0;

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  useFrame((state, delta) => {
    if (!group.current || !material.current) return;
    const { progress, reducedMotion } = useExperience.getState();
    const cameraDelta = state.camera.position.z - z;
    const opacity = THREE.MathUtils.clamp((cameraDelta - 0.2) / 1.8, 0, 1);
    material.current.opacity = THREE.MathUtils.damp(material.current.opacity, opacity, 8, delta);
    const stage = progress * (PORTALS.length - 1);
    const proximity = Math.max(0, 1 - Math.abs(stage - index));
    const scale = 1 + proximity * (reducedMotion ? 0 : 0.045);
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, scale, 4, delta));
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, reducedMotion ? 0 : (stage - index) * 0.004, 4, delta);
  });

  return <group ref={group} position={[x, 0, z]}>
    <mesh>
      <planeGeometry args={[12.8, 7.2]}/>
      <meshBasicMaterial ref={material} map={texture} transparent opacity={1} toneMapped={false}/>
    </mesh>
    <mesh position={[0, 0, -0.08]}>
      <planeGeometry args={[13.2, 7.6]}/>
      <meshBasicMaterial color="#090806"/>
    </mesh>
    <mesh position={[0, -3.72, 0.16]}>
      <boxGeometry args={[13.1, 0.025, 0.025]}/>
      <meshBasicMaterial color={index === 6 ? "#a8f36a" : "#d9a75d"} transparent opacity={0.55}/>
    </mesh>
  </group>;
}

function ProductGallery() {
  const group = useRef<THREE.Group>(null);
  const textures = useTexture(PRODUCT_IMAGES);
  useEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    });
  }, [textures]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const { scene, localProgress, reducedMotion } = useExperience.getState();
    const target = scene === 3 || scene === 4 ? 1 : 0;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, target, 5, delta));
    group.current.rotation.y = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.18) * 0.035;
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, scene === 4 ? -0.2 + localProgress * 0.25 : 0, 4, delta);
  });

  return <group ref={group} position={[0, 0, -47.4]} scale={0}>
    {textures.map((texture, index) => <mesh key={PRODUCT_IMAGES[index]} position={[(index - 1) * 2.55, index === 1 ? 0.3 : -0.1, index * 0.16]} rotation={[0, (1 - index) * 0.12, (index - 1) * 0.025]}>
      <planeGeometry args={[2.15, 3.05]}/>
      <meshBasicMaterial map={texture} toneMapped={false}/>
    </mesh>)}
  </group>;
}

function DataRibbon() {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!mesh.current) return;
    const { progress, reducedMotion } = useExperience.getState();
    mesh.current.rotation.z += reducedMotion ? 0 : delta * 0.055;
    mesh.current.position.z = -15 - progress * 86;
  });
  return <mesh ref={mesh} position={[0, -2.85, -15]} rotation={[Math.PI / 2, 0, 0]}>
    <torusGeometry args={[3.3, 0.018, 8, 180]}/>
    <meshBasicMaterial color="#a8f36a" transparent opacity={0.26}/>
  </mesh>;
}

function AssetProgress() {
  const { active, progress } = useProgress();
  return <div className={`asset-progress ${active ? "visible" : ""}`} aria-hidden={!active}>
    <span>Building the experience</span><b>{Math.round(progress)}%</b><i><em style={{ width: `${progress}%` }}/></i>
  </div>;
}
