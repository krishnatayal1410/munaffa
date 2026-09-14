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
  { eyebrow: "01 / ARRIVAL", title: <>Do not show hospitality.<br/><em>Let people enter it.</em></>, body: "A cinematic Munaffa experience built around real spaces, depth and motion—not a dashboard placed on top of a black background." },
  { eyebrow: "02 / THE PROPERTY", title: <>Architecture becomes<br/><em>the interface.</em></>, body: "The scroll behaves like a guided camera. Space, scale and pacing do the storytelling before conventional UI appears." },
  { eyebrow: "03 / THE TABLE", title: <>A table can become<br/><em>a live touchpoint.</em></>, body: "Ordering should feel like part of the venue. Try the working interaction while the cinematic camera remains inside the dining environment." },
  { eyebrow: "04 / THE DISH", title: <>Food deserves<br/><em>product-level theatre.</em></>, body: "Macro imagery, floating product compositions and depth transitions give the menu the same attention premium product sites give their hero object." },
  { eyebrow: "05 / THE LENS", title: <>Point. Inspect.<br/><em>Understand the plate.</em></>, body: "The AR-style lens uses the device camera when permission is granted and overlays ingredient context without pretending this prototype performs automatic food recognition." },
  { eyebrow: "06 / BEHIND THE SCENES", title: <>The beautiful front<br/><em>has an operating back.</em></>, body: "The visual journey moves beyond the guest view into service, preparation and the systems that keep hospitality moving." },
  { eyebrow: "07 / PROFIT VISIBILITY", title: <>What looks small<br/><em>can compound.</em></>, body: "Use the working scenario lens to explore how waste, stock variance and untracked discount assumptions can add up over time." },
  { eyebrow: "08 / EVERY RHYTHM", title: <>Hotel. Restaurant. Café.<br/><em>Resort. QSR. Kitchen.</em></>, body: "Different hospitality formats need different experiences. Munaffa's visual language can move between them without collapsing into generic SaaS design." },
  { eyebrow: "09 / MUNAFFA", title: <>Experience first.<br/><em>Operations underneath.</em></>, body: "Now move from the cinematic story into the working meeting demo: guest ordering and the hospitality operating workspace share the same browser state." }
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
          {index === 0 && <a href="#chapter-1" className="scroll-cue" data-reveal>Scroll into the experience <ArrowDown size={15}/></a>}
          {index === 2 && <><MenuExperience/><a className="story-deep-link" href="/order/demo" data-reveal><QrCode size={14}/> Open the full guest-order demo</a></>}
          {index === 3 && <div className="product-caption" data-reveal><UtensilsCrossed size={15}/><span>Real product photography floats in depth while the camera passes through the culinary chapter.</span></div>}
          {index === 4 && <ARLens/>}
          {index === 6 && <ProfitLens/>}
          {index === 7 && <div className="industry-cloud" data-reveal><span>HOTEL</span><span>RESTAURANT</span><span>CAFÉ</span><span>RESORT</span><span>QSR</span><span>CLOUD KITCHEN</span></div>}
          {index === 8 && <div className="final-actions" data-reveal><a href="/app" className="primary-action"><LayoutDashboard size={14}/> Open working workspace</a><a href="/order/demo" className="secondary-action"><QrCode size={14}/> Guest ordering</a><a href="#chapter-0" className="secondary-action">Replay</a></div>}
        </div><span className="chapter-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      </section>)}
    </div>
    <footer className="site-footer"><Brand/><p>Cinematic story + functional local meeting demo. Production integrations are connected separately.</p><div><a href="/app">Workspace</a><a href="/order/demo">Guest demo</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></footer>
  </main>;
}

function Header(){return <header className="floating-header"><Brand/><nav><a href="#chapter-2">Menu</a><a href="#chapter-4"><Camera size={12}/> AR Lens</a><a href="#chapter-6"><CircleDollarSign size={12}/> Profit</a><a href="/app"><LayoutDashboard size={12}/> Workspace</a></nav><a className="enter-link" href="/order/demo">DEMO <ArrowRight size={12}/></a></header>}
function Brand(){return <a className="brand" href="#chapter-0"><i>M</i><span>MUNAFFA</span></a>}
function ProgressRail({scene}:{scene:number}){return <aside className="progress-rail" aria-label="Experience chapters">{chapters.map((chapter,index)=><a key={chapter.eyebrow} href={`#chapter-${index}`} className={index===scene?"active":index<scene?"passed":""} aria-label={`Go to ${chapter.eyebrow}`}><i/></a>)}</aside>}
