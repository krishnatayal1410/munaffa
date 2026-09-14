"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useExperience } from "@/lib/experience";

export function ScrollDirector() {
  const update = useExperience((state) => state.update);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const story = document.querySelector<HTMLElement>("#story");
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    if (!story || sections.length === 0) return;

    if (reduced) {
      update({ progress: 0, scene: 0, localProgress: 0 });
      return;
    }

    const context = gsap.context(() => {
      ScrollTrigger.create({
        trigger: story,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => update({ progress: self.progress })
      });

      sections.forEach((section, index) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top 58%",
          end: "bottom 42%",
          onEnter: () => update({ scene: index, localProgress: 0 }),
          onEnterBack: () => update({ scene: index, localProgress: 1 }),
          onUpdate: (self) => update({ scene: index, localProgress: self.progress })
        });

        const reveal = section.querySelectorAll<HTMLElement>("[data-reveal]");
        if (reveal.length) {
          gsap.fromTo(reveal,
            { y: 34, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.06,
              ease: "none",
              scrollTrigger: { trigger: section, start: "top 78%", end: "top 38%", scrub: 1 }
            }
          );
        }

        const background = section.querySelector<HTMLElement>(".cinema-bg");
        if (background) {
          gsap.fromTo(background,
            { scale: 1.09, yPercent: -2 },
            {
              scale: 1.01,
              yPercent: 2,
              ease: "none",
              scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
            }
          );
        }
      });
    });

    return () => {
      context.revert();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [update]);

  return null;
}
