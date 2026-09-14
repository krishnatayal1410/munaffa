"use client";

import { Camera, CameraOff, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function ARLens() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera access is not supported in this browser.");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setActive(true);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Camera permission was not granted.");
      }
    }

    start();
    return () => {
      cancelled = true;
      setActive(false);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [open]);

  function close() {
    setOpen(false);
    setError(null);
    setActive(false);
  }

  return <>
    <button type="button" className="ar-launch" onClick={() => setOpen(true)} data-reveal><Camera size={15}/> Launch ingredient lens</button>
    {open && <div className="ar-modal" role="dialog" aria-modal="true" aria-label="Ingredient lens demo">
      <div className="ar-device">
        <header><span>Munaffa Ingredient Lens</span><button type="button" onClick={close} aria-label="Close ingredient lens"><X size={17}/></button></header>
        <div className="ar-view">
          <video ref={videoRef} muted autoPlay playsInline/>
          {!active && <div className="ar-fallback" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.18),rgba(0,0,0,.18)),url(https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=88)" }}>
            {error ? <><CameraOff size={28}/><b>Camera unavailable</b><p>{error}</p><small>The sample view stays interactive so you can inspect the intended experience.</small></> : <><Camera size={28}/><b>Starting camera…</b></>}
          </div>}
          <Ingredient className="tag-a" name="Avocado" detail="healthy fats"/>
          <Ingredient className="tag-b" name="Tomato" detail="vitamin C"/>
          <Ingredient className="tag-c" name="Cucumber" detail="fresh produce"/>
          <Ingredient className="tag-d" name="Protein" detail="recipe standard"/>
          <div className="ar-reticle"><i/><i/><i/><i/></div>
        </div>
        <footer><span>DEMO MODE</span><p>Labels illustrate an AR-style menu interaction; this prototype does not claim automated food recognition.</p></footer>
      </div>
    </div>}
  </>;
}

function Ingredient({ className, name, detail }: { className: string; name: string; detail: string }) {
  return <div className={`ingredient-tag ${className}`}><i/><div><b>{name}</b><small>{detail}</small></div></div>;
}
