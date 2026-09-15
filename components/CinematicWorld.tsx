"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, useTexture } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useExperience } from "@/lib/experience";
import styles from "./CinematicWorld.module.css";

type V3 = [number, number, number];
type PortalScene = {
  label: string;
  image: string;
  position: V3;
  rotation: V3;
  warmth: string;
};

const portalScenes: PortalScene[] = [
  { label: "Arrival", image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2400&q=92", position: [0, 0, -6], rotation: [0, 0, 0], warmth: "#d8a968" },
  { label: "Property", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=92", position: [1.25, 0.18, -20], rotation: [0, -0.035, 0.008], warmth: "#e8c58e" },
  { label: "Table", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2400&q=92", position: [-1.35, -0.08, -34], rotation: [0, 0.045, -0.006], warmth: "#cc915d" },
  { label: "Dish", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=92", position: [0.85, 0.12, -48], rotation: [0, -0.04, 0.006], warmth: "#e6a361" },
  { label: "Ingredient lens", image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=2400&q=92", position: [-0.55, -0.04, -62], rotation: [0, 0.035, 0], warmth: "#b7ce78" },
  { label: "Kitchen", image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=2400&q=92", position: [1.05, 0.1, -76], rotation: [0, -0.045, 0], warmth: "#e2bd8c" },
  { label: "Operations", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2400&q=92", position: [-1.15, 0.02, -90], rotation: [0, 0.045, 0], warmth: "#91c99a" },
  { label: "Hospitality", image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2400&q=92", position: [0.65, 0.1, -104], rotation: [0, -0.035, 0], warmth: "#c9bf8a" },
  { label: "Munaffa", image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=2400&q=92", position: [0, 0, -118], rotation: [0, 0, 0], warmth: "#a8f36a" }
];

const foodImages = [
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=94",
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=94",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=1000&q=94"
];

const clamp = (v:number,min=0,max=1) => Math.min(max,Math.max(min,v));

export function CinematicWorld(){
  return <div className={styles.stage} aria-hidden="true">
    <Canvas
      dpr={[1,1.65]}
      camera={{ position:[0,0.1,7], fov:48, near:0.1, far:180 }}
      gl={{ antialias:true, alpha:false, powerPreference:"high-performance", toneMapping:THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={["#050504"]}/>
      <fog attach="fog" args={["#050504",18,42]}/>
      <ambientLight intensity={0.34}/>
      <directionalLight position={[3,5,8]} intensity={1.35} color="#fff0d7"/>
      <Suspense fallback={null}>
        <Journey/>
      </Suspense>
    </Canvas>
    <div className={styles.atmosphere}/>
    <div className={styles.grain}/>
    <div className={styles.vignette}/>
    <SceneLabel/>
  </div>;
}

function Journey(){
  return <>
    <CameraRig/>
    {portalScenes.map((scene,index)=><Portal key={scene.label} scene={scene} index={index}/>)}
    <CulinaryObjects/>
    <SignalTrail/>
  </>;
}

function CameraRig(){
  const { camera } = useThree();
  const curve = useMemo(()=>new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0.05,7),
    new THREE.Vector3(0.25,0.02,-8.4),
    new THREE.Vector3(1.0,0.16,-22.3),
    new THREE.Vector3(-1.1,-0.02,-36.2),
    new THREE.Vector3(0.72,0.12,-50.1),
    new THREE.Vector3(-0.45,0.02,-64.1),
    new THREE.Vector3(0.9,0.1,-78.1),
    new THREE.Vector3(-0.9,0.05,-92.1),
    new THREE.Vector3(0.5,0.1,-106.1),
    new THREE.Vector3(0,0,-113.6)
  ],false,"catmullrom",0.22),[]);

  useFrame((state,delta)=>{
    const { progress,pointerX,pointerY,velocity,reducedMotion } = useExperience.getState();
    const p = clamp(progress);
    const targetPos = curve.getPointAt(p);
    const ahead = curve.getPointAt(Math.min(1,p+0.018));
    const px = reducedMotion ? 0 : pointerX*0.24;
    const py = reducedMotion ? 0 : pointerY*0.12;
    targetPos.x += px;
    targetPos.y += py;
    camera.position.x = THREE.MathUtils.damp(camera.position.x,targetPos.x,reducedMotion?12:4.4,delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y,targetPos.y,reducedMotion?12:4.4,delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z,targetPos.z,reducedMotion?12:5.1,delta);
    const look = ahead.clone();
    look.x += px*0.26;
    look.y += py*0.18;
    camera.lookAt(look);
    const kinetic = reducedMotion ? 0 : Math.min(1,Math.abs(velocity)/2100);
    const perspective = camera as THREE.PerspectiveCamera;
    perspective.fov = THREE.MathUtils.damp(perspective.fov,48+kinetic*6,reducedMotion?12:4,delta);
    perspective.updateProjectionMatrix();
    state.gl.toneMappingExposure = THREE.MathUtils.damp(state.gl.toneMappingExposure,0.92+kinetic*0.08,4,delta);
  });
  return null;
}

function Portal({scene,index}:{scene:PortalScene;index:number}){
  const texture = useTexture(scene.image);
  const group = useRef<THREE.Group>(null);
  const imageMat = useRef<THREE.MeshBasicMaterial>(null);
  const frameMat = useRef<THREE.MeshStandardMaterial>(null);

  useMemo(()=>{ texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=8; },[texture]);

  useFrame((state,delta)=>{
    if(!group.current || !imageMat.current) return;
    const dz = state.camera.position.z - scene.position[2];
    const nearFade = THREE.MathUtils.smoothstep(dz,-0.8,2.3);
    const farFade = 1-THREE.MathUtils.smoothstep(dz,24,39);
    const opacity = clamp(nearFade*farFade);
    imageMat.current.opacity = THREE.MathUtils.damp(imageMat.current.opacity,opacity,7,delta);
    if(frameMat.current) frameMat.current.opacity = imageMat.current.opacity*0.34;
    const {pointerX,pointerY,reducedMotion} = useExperience.getState();
    const active = Math.max(0,1-Math.abs(useExperience.getState().scene-index));
    const rx = reducedMotion?0:pointerY*0.008*active;
    const ry = reducedMotion?0:pointerX*0.012*active;
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x,scene.rotation[0]+rx,4,delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y,scene.rotation[1]+ry,4,delta);
  });

  return <group ref={group} position={scene.position} rotation={scene.rotation}>
    <mesh>
      <planeGeometry args={[18.4,10.35,1,1]}/>
      <meshBasicMaterial ref={imageMat} map={texture} transparent opacity={1} toneMapped={false}/>
    </mesh>
    <mesh position={[0,0,-0.11]}>
      <planeGeometry args={[19.15,11.08]}/>
      <meshStandardMaterial ref={frameMat} color="#090907" roughness={0.34} metalness={0.38} transparent opacity={0.18}/>
    </mesh>
    <mesh position={[0,-5.17,0.05]}>
      <boxGeometry args={[18.8,0.025,0.16]}/>
      <meshBasicMaterial color={scene.warmth} transparent opacity={0.35}/>
    </mesh>
  </group>;
}

function CulinaryObjects(){
  const textures = useTexture(foodImages);
  useMemo(()=>textures.forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;}),[textures]);
  const anchorZ = -45.5;
  return <group position={[0,0,anchorZ]}>
    {textures.map((texture,index)=>{
      const positions:V3[]=[[-3.3,0.7,1.4],[0,-0.15,0.15],[3.15,-0.55,1.0]];
      const rotations:V3[]=[[0,0.26,-0.08],[0,-0.02,0],[0,-0.23,0.08]];
      return <Float key={foodImages[index]} speed={0.7+index*0.12} rotationIntensity={0.06} floatIntensity={0.16}>
        <group position={positions[index]} rotation={rotations[index]}>
          <mesh>
            <planeGeometry args={[3.0,4.0]}/>
            <meshBasicMaterial map={texture} toneMapped={false}/>
          </mesh>
          <mesh position={[0,0,-0.08]}>
            <planeGeometry args={[3.18,4.18]}/>
            <meshStandardMaterial color="#16120d" roughness={0.32} metalness={0.22}/>
          </mesh>
        </group>
      </Float>;
    })}
  </group>;
}

function SignalTrail(){
  const points = useMemo(()=>[
    new THREE.Vector3(-1.2,-2.8,-31),
    new THREE.Vector3(-0.2,-2.7,-39),
    new THREE.Vector3(0.7,-2.65,-48),
    new THREE.Vector3(-0.3,-2.6,-60),
    new THREE.Vector3(0.8,-2.55,-74),
    new THREE.Vector3(-0.7,-2.5,-88),
    new THREE.Vector3(0,-2.45,-103)
  ],[]);
  const curve = useMemo(()=>new THREE.CatmullRomCurve3(points),[points]);
  const geometry = useMemo(()=>new THREE.TubeGeometry(curve,160,0.018,8,false),[curve]);
  const token = useRef<THREE.Mesh>(null);
  useFrame((_,delta)=>{
    if(!token.current) return;
    const {progress,reducedMotion}=useExperience.getState();
    const p=clamp((progress-0.18)/0.68);
    const pos=curve.getPointAt(p);
    token.current.position.lerp(pos,reducedMotion?1:Math.min(1,delta*8));
  });
  return <>
    <mesh geometry={geometry}><meshBasicMaterial color="#a8f36a" transparent opacity={0.34}/></mesh>
    <mesh ref={token}><sphereGeometry args={[0.095,20,20]}/><meshBasicMaterial color="#c7ff91" toneMapped={false}/></mesh>
  </>;
}

function SceneLabel(){
  const scene=useExperience(s=>s.scene);
  const current=portalScenes[Math.min(portalScenes.length-1,scene)];
  return <div className={styles.sceneLabel}><span>{String(scene+1).padStart(2,"0")}</span><b>{current.label}</b></div>;
}
