"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { World3D } from "@/components/World3D";
import { useExperience } from "@/lib/experience";

const scenes = [
  { eyebrow: "Munaffa / 01", title: <>Hospitality is a<br/><em>living system.</em></>, body: "Walk through the operating chain itself. The camera moves through the business while every interaction becomes a signal." },
  { eyebrow: "Restaurant / 02", title: <>A table becomes<br/><em>a signal.</em></>, body: "The order starts in the guest environment, then physically travels through the same 3D world toward service." },
  { eyebrow: "Kitchen / 03", title: <>The order<br/><em>keeps moving.</em></>, body: "Service, preparation and timing exist in one flow instead of disconnected screens." },
  { eyebrow: "Recipe / 04", title: <>Every dish<br/><em>consumes margin.</em></>, body: "Recipe standards define theoretical ingredient usage and cost without pretending every gram is physically measured." },
  { eyebrow: "Inventory / 05", title: <>Expected stock.<br/><em>Physical truth.</em></>, body: "What should remain and what was actually counted stay separate. Variance becomes something to investigate." },
  { eyebrow: "Leakage / 06", title: <>Profit does not vanish.<br/><em>It leaks.</em></>, body: "Waste, variance, discounting, slow service and inconsistency pull the operating system apart." },
  { eyebrow: "Munaffa Core / 07", title: <>Bring the system<br/><em>back together.</em></>, body: "Orders, kitchen, inventory, payments and operating signals reconnect around one profit model." },
  { eyebrow: "Hospitality / 08", title: <>Hotel. Restaurant. Café.<br/><em>One operating language.</em></>, body: "Different hospitality formats. Different rhythms. The same need for connected operational visibility." },
  { eyebrow: "Final / 09", title: <>Run the business<br/><em>on visibility.</em></>, body: "A cinematic view of Munaffa before the product application is built around it." }
];

export function ImmersiveHomepage() {
  const root = useRef<HTMLElement>(null);
  const update = useExperience((state) => state.update);
  const activeScene = useExperience((state) => state.scene);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    update({ reducedMotion: reduced });
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    const story = document.getElementById("story");
    if (!story || sections.length === 0) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => update({ progress: self.progress })
      });

      sections.forEach((section, index) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () => update({ scene: index, localProgress: 0 }),
          onEnterBack: () => update({ scene: index, localProgress: 1 }),
          onUpdate: (self) => update({ scene: index, localProgress: self.progress })
        });

        const reveal = section.querySelectorAll<HTMLElement>("[data-reveal]");
        if (!reduced && reveal.length) {
          gsap.fromTo(reveal,
            { opacity: 0, y: 46, filter: "blur(10px)" },
            {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              stagger: 0.08,
              ease: "none",
              scrollTrigger: { trigger: section, start: "top 80%", end: "top 42%", scrub: 1 }
            }
          );
        }
      });
    }, root);

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [update]);

  function pointerMove(event: React.PointerEvent<HTMLElement>) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -((event.clientY / window.innerHeight) * 2 - 1);
    update({ pointerX: x, pointerY: y });
  }

  return <main ref={root} onPointerMove={pointerMove} className={`experience scene-${activeScene}`}>
    <World3D/>
    <div className="vignette" aria-hidden="true"/>
    <Header/>
    <Progress scene={activeScene}/>

    <div id="story" className="story">
      {scenes.map((scene, index) => <section
        key={scene.eyebrow}
        data-scene={index}
        className={`chapter chapter-${index} ${index % 2 ? "chapter-right" : "chapter-left"}`}
      >
        <div className="chapter-copy">
          <span className="eyebrow" data-reveal>{scene.eyebrow}</span>
          <h1 data-reveal>{scene.title}</h1>
          <p data-reveal>{scene.body}</p>
          {index === 0 && <div className="scroll-cue" data-reveal><span>Scroll to enter</span><ArrowDown size={15}/></div>}
          {index === 5 && <div className="leak-legend" data-reveal><span>Waste</span><span>Variance</span><span>Discounts</span><span>Service friction</span></div>}
          {index === 7 && <div className="industry-words" data-reveal><b>HOTEL</b><b>RESTAURANT</b><b>CAFÉ</b><b>RESORT</b><b>QSR</b></div>}
          {index === 8 && <a className="hero-cta" href="#story" data-reveal>Replay the journey <ArrowRight size={15}/></a>}
        </div>
        <span className="chapter-number" aria-hidden="true">0{index + 1}</span>
      </section>)}
    </div>

    <footer className="experience-footer">
      <Brand/>
      <span>Homepage concept first. Product application comes after the experience is approved.</span>
      <a href="#story">Back to top ↑</a>
    </footer>
  </main>;
}

function Header() {
  return <header className="floating-header">
    <Brand/>
    <div className="header-center">IMMERSIVE HOSPITALITY SYSTEM</div>
    <a href="#story" className="header-action">ENTER <ArrowRight size={12}/></a>
  </header>;
}

function Brand() {
  return <a className="brand" href="#story"><i>M</i><span>Munaffa</span></a>;
}

function Progress({ scene }: { scene: number }) {
  return <aside className="progress-rail" aria-label="Story progress">
    {scenes.map((item, index) => <a key={item.eyebrow} href={`#scene-${index}`} className={scene === index ? "active" : scene > index ? "passed" : ""} aria-label={`Scene ${index + 1}`}><i/></a>)}
  </aside>;
}
