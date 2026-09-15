"use client";

import { ArrowDown, ArrowRight, Camera, CircleDollarSign, LayoutDashboard, QrCode, UtensilsCrossed } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { ARLens } from "@/components/ARLens";
import { CinematicWorld } from "@/components/CinematicWorld";
import { MenuExperience } from "@/components/MenuExperience";
import { ProfitLens } from "@/components/ProfitLens";
import { useExperience } from "@/lib/experience";

const chapters = [
  { eyebrow: "01 / ARRIVE", title: <>Hospitality should be<br/><em>felt before it is managed.</em></>, body: "Enter Munaffa through the venue itself. Scroll becomes the camera and the property becomes the interface." },
  { eyebrow: "02 / PROPERTY", title: <>Move through the space.<br/><em>Not through slides.</em></>, body: "The camera travels through real-looking hospitality environments with perspective, depth and spatial continuity." },
  { eyebrow: "03 / ORDER", title: <>The guest journey<br/><em>starts at the table.</em></>, body: "Guests can discover, order and request service without leaving the experience. The operating system begins at the same moment." },
  { eyebrow: "04 / PRODUCT", title: <>Every dish is<br/><em>a product and a cost.</em></>, body: "Food is presented with the same visual theatre as a premium product launch while recipe and cost logic sit underneath it." },
  { eyebrow: "05 / LENS", title: <>Point. Inspect.<br/><em>Understand what is served.</em></>, body: "Use the device camera for an AR-style ingredient experience, with clear fallback behaviour where camera access is unavailable." },
  { eyebrow: "06 / OPERATIONS", title: <>Front of house.<br/><em>Back of house. One flow.</em></>, body: "Orders move into service and preparation, connecting the guest moment to kitchen execution and operating visibility." },
  { eyebrow: "07 / INVENTORY", title: <>What should remain.<br/><em>What actually remains.</em></>, body: "Recipe-driven theoretical usage stays separate from physical stock counts so variance can be investigated instead of guessed." },
  { eyebrow: "08 / PROFIT", title: <>Revenue is visible.<br/><em>Leakage should be too.</em></>, body: "Explore how waste, stock variance, discounts and operating friction can affect contribution without pretending assumptions are measured facts." },
  { eyebrow: "09 / MUNAFFA OS", title: <>One hospitality system.<br/><em>From guest to profit.</em></>, body: "Ordering, kitchen, inventory, purchasing, finance and guest operations converge into one operating layer for hospitality businesses." }
];

export function ImmersiveSite() {
  const root = useRef<HTMLElement>(null);
  const update = useExperience((state) => state.update);
  const activeScene = useExperience((state) => state.scene);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    update({ reducedMotion: reduced });
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    const story = document.getElementById("experience-story");
    if (!story || sections.length === 0) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({ trigger: story, start: "top top", end: "bottom bottom", onUpdate: (self) => update({ progress: self.progress, velocity: self.getVelocity() }) });
      sections.forEach((section, index) => {
        ScrollTrigger.create({ trigger: section, start: "top 58%", end: "bottom 42%", onEnter: () => update({ scene: index, localProgress: 0 }), onEnterBack: () => update({ scene: index, localProgress: 1 }), onUpdate: (self) => update({ scene: index, localProgress: self.progress }) });
        if (!reduced) {
          const reveal = section.querySelectorAll<HTMLElement>("[data-reveal]");
          if (reveal.length) gsap.fromTo(reveal, { opacity: 0, y: 42, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", stagger: 0.07, ease: "none", scrollTrigger: { trigger: section, start: "top 80%", end: "top 42%", scrub: 1 } });
        }
      });
    }, root);
    return () => ctx.revert();
  }, [update]);

  function pointerMove(event: React.PointerEvent<HTMLElement>) { update({ pointerX: (event.clientX / window.innerWidth) * 2 - 1, pointerY: -((event.clientY / window.innerHeight) * 2 - 1) }); }

  return <main ref={root} className={`experience scene-${activeScene}`} onPointerMove={pointerMove}>
    <CinematicWorld/><div className="cinematic-vignette" aria-hidden="true"/><Header/><ProgressRail scene={activeScene}/>
    <div id="experience-story" className="story">
      {chapters.map((chapter, index) => <section id={`chapter-${index}`} data-scene={index} className={`chapter ${index % 2 ? "chapter-right" : "chapter-left"}`} key={chapter.eyebrow}>
        <div className="chapter-copy"><span className="chapter-kicker" data-reveal>{chapter.eyebrow}</span><h1 data-reveal>{chapter.title}</h1><p data-reveal>{chapter.body}</p>
          {index === 0 && <a href="#chapter-1" className="scroll-cue" data-reveal>Enter Munaffa <ArrowDown size={15}/></a>}
          {index === 2 && <><MenuExperience/><a className="story-deep-link" href="/order" data-reveal><QrCode size={14}/> Open guest ordering</a></>}
          {index === 3 && <div className="product-caption" data-reveal><UtensilsCrossed size={15}/><span>Product presentation, recipe logic and theoretical food cost belong to the same operating story.</span></div>}
          {index === 4 && <ARLens/>}
          {index === 7 && <ProfitLens/>}
          {index === 8 && <div className="final-actions" data-reveal><a href="/app" className="primary-action"><LayoutDashboard size={14}/> Open Munaffa OS</a><a href="/order" className="secondary-action"><QrCode size={14}/> Guest ordering</a><a href="/pilot" className="secondary-action">Start a pilot</a></div>}
        </div><span className="chapter-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      </section>)}
    </div>
    <footer className="site-footer"><Brand/><p>Hospitality operations from guest experience to profit visibility.</p><div><a href="/app">Munaffa OS</a><a href="/order">Ordering</a><a href="/pilot">Pilot</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></footer>
  </main>;
}

function Header(){return <header className="floating-header"><Brand/><nav><a href="#chapter-2">Ordering</a><a href="#chapter-4"><Camera size={12}/> AR Lens</a><a href="#chapter-7"><CircleDollarSign size={12}/> Profit</a><a href="/app"><LayoutDashboard size={12}/> OS</a></nav><a className="enter-link" href="/order">ENTER <ArrowRight size={12}/></a></header>}
function Brand(){return <a className="brand" href="#chapter-0"><i>M</i><span>MUNAFFA</span></a>}
function ProgressRail({scene}:{scene:number}){return <aside className="progress-rail" aria-label="Experience chapters">{chapters.map((chapter,index)=><a key={chapter.eyebrow} href={`#chapter-${index}`} className={index===scene?"active":index<scene?"passed":""} aria-label={`Go to ${chapter.eyebrow}`}><i/></a>)}</aside>}
