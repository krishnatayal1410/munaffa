"use client";

import { ArrowDown, ArrowRight, LayoutDashboard, QrCode, UtensilsCrossed } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";
import { CinematicWorld } from "@/components/CinematicWorld";
import { MenuExperience } from "@/components/MenuExperience";
import { ProfitLens } from "@/components/ProfitLens";
import { useExperience } from "@/lib/experience";

const chapters = [
  { eyebrow: "01 / PROFIT OS", title: <>Know where<br/><em>every rupee goes.</em></>, body: "Munaffa connects the guest moment to the owner decision. Orders, recipes, stock, payments and guest activity become one operating story instead of disconnected tools." },
  { eyebrow: "02 / GUEST ORDER", title: <>Har order ka<br/><em>asli munafa starts here.</em></>, body: "Guests order from the table without installing an app. The order is identified once, sent into operations, and kept connected all the way to billing and profitability." },
  { eyebrow: "03 / KITCHEN", title: <>From table to kitchen.<br/><em>No broken handoff.</em></>, body: "The same order reaches the KDS with preparation state, timing and item detail. Front of house and kitchen work from one shared operational flow." },
  { eyebrow: "04 / INVENTORY", title: <>What should remain.<br/><em>What actually remains.</em></>, body: "Recipe-driven theoretical usage stays separate from physical stock counts. Purchases, waste and variance can be investigated instead of guessed." },
  { eyebrow: "05 / RECIPE ECONOMICS", title: <>Every dish is<br/><em>revenue and cost.</em></>, body: "Munaffa connects recipes, ingredient quantities and selling price so owners can see theoretical food cost and contribution at the dish level." },
  { eyebrow: "06 / BILLING", title: <>Close the order.<br/><em>Keep the data connected.</em></>, body: "Billing and payment complete the same order identity, so revenue does not become a separate number disconnected from what was cooked and consumed." },
  { eyebrow: "07 / GUEST MEMORY", title: <>A transaction can become<br/><em>a returning guest.</em></>, body: "Feedback, visit history and preference signals create a usable guest layer for retention, service recovery and repeat business." },
  { eyebrow: "08 / PROFIT INTELLIGENCE", title: <>Revenue is visible.<br/><em>Leakage should be too.</em></>, body: "Waste, stock variance, discounting and recipe economics can be inspected together so owners understand where contribution may be leaking." },
  { eyebrow: "09 / MUNAFFA OS", title: <>Sell more. Waste less.<br/><em>Keep more.</em></>, body: "Guest ordering, waiter operations, kitchen, recipes, inventory, purchasing, billing, CRM and profit intelligence converge into one operating layer for independent restaurants and cafés." }
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

  function pointerMove(event: React.PointerEvent<HTMLElement>) {
    update({ pointerX: (event.clientX / window.innerWidth) * 2 - 1, pointerY: -((event.clientY / window.innerHeight) * 2 - 1) });
  }

  return <main ref={root} className={`experience scene-${activeScene}`} onPointerMove={pointerMove}>
    <CinematicWorld/><div className="cinematic-vignette" aria-hidden="true"/><Header/><ProgressRail scene={activeScene}/>
    <div id="experience-story" className="story">
      {chapters.map((chapter, index) => <section id={`chapter-${index}`} data-scene={index} className={`chapter ${index % 2 ? "chapter-right" : "chapter-left"}`} key={chapter.eyebrow}>
        <div className="chapter-copy">
          <span className="chapter-kicker" data-reveal>{chapter.eyebrow}</span>
          <h1 data-reveal>{chapter.title}</h1>
          <p data-reveal>{chapter.body}</p>
          {index === 0 && <a href="#chapter-1" className="scroll-cue" data-reveal>Follow one order <ArrowDown size={15}/></a>}
          {index === 1 && <><MenuExperience/><a className="story-deep-link" href="/order" data-reveal><QrCode size={14}/> Open guest ordering</a></>}
          {index === 4 && <div className="product-caption" data-reveal><UtensilsCrossed size={15}/><span>Recipe costing is theoretical until reconciled with purchasing, waste and physical stock. Munaffa keeps those concepts separate.</span></div>}
          {index === 7 && <ProfitLens/>}
          {index === 8 && <>
            <div className="industry-cloud" data-reveal><span>Launch · ₹999/mo</span><span>Growth · ₹2,499/mo</span><span>Profit · ₹4,999/mo</span><span>30-day design-partner pilot</span></div>
            <div className="final-actions" data-reveal><a href="/app" className="primary-action"><LayoutDashboard size={14}/> Open Munaffa OS</a><a href="/order" className="secondary-action"><QrCode size={14}/> Guest ordering</a><a href="/pilot" className="secondary-action">Start a pilot</a></div>
          </>}
        </div>
        <span className="chapter-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      </section>)}
    </div>
    <footer className="site-footer"><Brand/><p>Restaurant operations from guest order to profit visibility.</p><div><a href="/app">Munaffa OS</a><a href="/order">Ordering</a><a href="/pilot">Pilot</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div></footer>
  </main>;
}

function Header(){return <header className="floating-header"><Brand/><nav><a href="#chapter-1">Ordering</a><a href="#chapter-2">Kitchen</a><a href="#chapter-3">Inventory</a><a href="#chapter-7">Profit</a><a href="/app"><LayoutDashboard size={12}/> OS</a></nav><a className="enter-link" href="/order">ENTER <ArrowRight size={12}/></a></header>}
function Brand(){return <a className="brand" href="#chapter-0"><i>M</i><span>MUNAFFA</span></a>}
function ProgressRail({scene}:{scene:number}){return <aside className="progress-rail" aria-label="Experience chapters">{chapters.map((chapter,index)=><a key={chapter.eyebrow} href={`#chapter-${index}`} className={index===scene?"active":index<scene?"passed":""} aria-label={`Go to ${chapter.eyebrow}`}><i/></a>)}</aside>}
