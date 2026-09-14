"use client";

import { useMemo } from "react";
import { useExperience } from "@/lib/experience";
import styles from "./CinematicWorld.module.css";

const scenes = [
  {label:"Arrival", image:"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2200&q=92", focus:"50% 54%", tint:"rgba(8,13,7,.10)"},
  {label:"Property", image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2200&q=92", focus:"50% 52%", tint:"rgba(35,19,6,.08)"},
  {label:"Table", image:"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2200&q=92", focus:"50% 50%", tint:"rgba(15,8,3,.08)"},
  {label:"Dish", image:"https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2200&q=92", focus:"50% 48%", tint:"rgba(23,10,2,.04)"},
  {label:"Lens", image:"https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=2200&q=92", focus:"50% 52%", tint:"rgba(17,8,2,.08)"},
  {label:"Kitchen", image:"https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=2200&q=92", focus:"50% 50%", tint:"rgba(10,10,9,.08)"},
  {label:"Operations", image:"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2200&q=92", focus:"50% 48%", tint:"rgba(4,14,8,.11)"},
  {label:"Every rhythm", image:"https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2200&q=92", focus:"50% 55%", tint:"rgba(7,14,9,.06)"},
  {label:"Munaffa", image:"https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=2200&q=92", focus:"50% 50%", tint:"rgba(7,19,8,.12)"}
] as const;

const productImages = [
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=760&q=92",
  "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=760&q=92",
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=760&q=92"
];

const clamp=(n:number,min=0,max=1)=>Math.min(max,Math.max(min,n));

export function CinematicWorld(){
  const scene=useExperience(s=>s.scene);
  const local=useExperience(s=>s.localProgress);
  const px=useExperience(s=>s.pointerX);
  const py=useExperience(s=>s.pointerY);
  const velocity=useExperience(s=>s.velocity);
  const reduced=useExperience(s=>s.reducedMotion);
  const stage=scene+clamp(local);
  const visible=useMemo(()=>scenes.map((item,index)=>({item,index,alpha:clamp(1-Math.abs(stage-index))})).filter(x=>x.alpha>.001),[stage]);
  const driftX=reduced?0:px*1.7;
  const driftY=reduced?0:py*.9;
  const kinetic=reduced?0:Math.min(1.6,Math.abs(velocity)/1700);
  const foodMode=stage>=2.65&&stage<=4.35;

  return <div className={styles.stage} aria-hidden="true">
    {visible.map(({item,index,alpha})=>{
      const d=index-stage;
      const incoming=d>0;
      const depth=Math.abs(d);
      const scale=reduced?1:1.035+(incoming?depth*.07:(1-depth)*.055)+kinetic*.006;
      const clip=incoming?Math.max(0,(1-alpha)*13):0;
      return <div key={item.label} className={styles.scene} style={{opacity:alpha,zIndex:10+index,clipPath:`inset(${clip}% ${clip*.55}% ${clip}% ${clip*.55}% round ${incoming?22:0}px)`,transform:`translate3d(${driftX*(index%2?1:-1)}px,${driftY}px,0) scale(${scale})`}}>
        <img src={item.image} alt="" draggable={false} loading={index<2?"eager":"lazy"} decoding="async" style={{objectPosition:item.focus}}/>
        <div className={styles.tint} style={{background:item.tint}}/>
      </div>;
    })}
    <div className={styles.depthGlass} style={{transform:`translate3d(${driftX*-5}px,${driftY*2}px,0) rotate(${px*.35}deg)`,opacity:reduced?0:.58}}/>
    <div className={styles.depthEdge} style={{transform:`translate3d(${driftX*4}px,${driftY*-2}px,0)`,opacity:reduced?0:.42}}/>
    <div className={`${styles.products} ${foodMode?styles.productsVisible:""}`} style={{transform:`translate3d(${px*-20}px,${py*10}px,0)`}}>
      {productImages.map((src,index)=><figure key={src} className={styles.product}><img src={src} alt="" loading="lazy" decoding="async"/><span>{index===0?"crafted":index===1?"served":"measured"}</span></figure>)}
    </div>
    <div className={styles.atmosphere}/><div className={styles.grain}/><div className={styles.vignette}/>
    <div className={styles.sceneLabel}><span>{String(Math.min(9,Math.floor(stage)+1)).padStart(2,"0")}</span><b>{scenes[Math.min(scenes.length-1,Math.round(stage))].label}</b></div>
  </div>;
}
