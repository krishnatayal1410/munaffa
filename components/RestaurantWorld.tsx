"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { CameraRig } from "./three/CameraRig";
import { Diorama } from "./three/Diorama";

export function RestaurantWorld() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [10, 8, 13], fov: 44, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#07100B"]} />
        <fogExp2 attach="fog" args={["#07100B", 0.022]} />
        <ambientLight intensity={0.45} />
        <hemisphereLight intensity={1.1} color="#CAF7D1" groundColor="#251407" />
        <spotLight position={[-2, 10, 5]} intensity={40} color="#FFC27A" angle={Math.PI / 4} penumbra={0.45} castShadow />
        <pointLight position={[2, 4, 1]} intensity={18} color="#8FFF73" distance={18} />
        <Suspense fallback={null}>
          <Diorama />
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
