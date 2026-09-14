"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { World } from "@/components/World";
import { scenes } from "@/lib/scenes";
import { useExperience } from "@/lib/store";

export function Experience() {
  const root = useRef<HTMLElement>(null);
  const set = useExperience((state) => state.set);
  const active = useExperience((state) => state.scene);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    set({ reducedMotion: reduced });
    const chapters = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    const story = document.getElementById("story");
    if (!story || chapters.length === 0) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const velocity = Math.max(-5000, Math.min(5000, self.getVelocity()));
          set({ progress: self.progress, velocity });
        }
      });

      chapters.forEach((chapter, index) => {
        ScrollTrigger.create({
          trigger: chapter,
          start: "top 58%",
          end: "bottom 42%",
          onEnter: () => set({ scene: index, local: 0 }),
          onEnterBack: () => set({ scene: index, local: 1 }),
          onUpdate: (self) => set({ scene: index, local: self.progress })
        });

        const copy = chapter.querySelectorAll<HTMLElement>("[data-reveal]");
        if (!reduced && copy.length) {
          gsap.fromTo(copy,
            { opacity: 0, y: 42, filter: "blur(12px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              stagger: 0.065,
              ease: "none",
              scrollTrigger: {
                trigger: chapter,
                start: "top 78%",
                end: "top 38%",
                scrub: 1
              }
            }
          );
        }
      });
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [set]);

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    set({
      pointerX: (event.clientX / window.innerWidth) * 2 - 1,
      pointerY: -((event.clientY / window.innerHeight) * 2 - 1)
    });
  }

  return <main ref={root} className={`experience scene-${active}`} onPointerMove={onPointerMove}>
    <World/>
    <div className="screen-vignette" aria-hidden="true"/>
    <header className="topbar">
      <a href="#scene-0" className="brand"><b>M</b><span>Munaffa</span></a>
      <span className="topbar-label">IMMERSIVE HOSPITALITY / PROFIT OS</span>
      <a href="#scene-10" className="topbar-enter">ENTER SYSTEM ↘</a>
    </header>

    <aside className="scene-index" aria-label="Experience chapters">
      {scenes.map((scene, index) => <a
        key={scene.eyebrow}
        href={`#scene-${index}`}
        className={active === index ? "active" : active > index ? "passed" : ""}
        aria-label={scene.eyebrow}
      ><i/><span>{String(index + 1).padStart(2, "0")}</span></a>)}
    </aside>

    <div id="story" className="story">
      {scenes.map((scene, index) => <section
        key={scene.eyebrow}
        id={`scene-${index}`}
        data-scene={index}
        className={`chapter chapter-${scene.side} tone-${scene.tone ?? "green"}`}
      >
        <div className="chapter-copy">
          <span className="eyebrow" data-reveal>{scene.eyebrow}</span>
          <h1 data-reveal>{scene.title}</h1>
          <p data-reveal>{scene.body}</p>
          {index === 0 && <div className="scroll-instruction" data-reveal><i/><span>SCROLL TO ENTER THE WORLD</span></div>}
          {index === 3 && <div className="micro-facts" data-reveal><span>RECIPE</span><span>EXPECTED USAGE</span><span>THEORETICAL COST</span></div>}
          {index === 4 && <div className="micro-facts" data-reveal><span>EXPECTED</span><span>PHYSICAL COUNT</span><span>VARIANCE</span></div>}
          {index === 6 && <div className="leak-words" data-reveal><span>WASTE</span><span>VARIANCE</span><span>DISCOUNTS</span><span>FRICTION</span></div>}
          {index === 8 && <div className="industry-list" data-reveal><b>HOTEL</b><b>RESTAURANT</b><b>CAFÉ</b><b>RESORT</b><b>QSR</b><b>CLOUD KITCHEN</b></div>}
          {index === 10 && <a className="final-cta" href="#scene-0" data-reveal>REPLAY EXPERIENCE ↗</a>}
        </div>
        <span className="giant-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      </section>)}
    </div>

    <footer className="footer">
      <div className="brand"><b>M</b><span>Munaffa</span></div>
      <span>3D homepage prototype · product application follows visual approval</span>
      <a href="#scene-0">BACK TO START ↑</a>
    </footer>
  </main>;
}
