"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useExperience, type ExperienceScene } from "@/lib/experience";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export function ExperienceController() {
  const setScene = useExperience((s) => s.setScene);
  const setProgress = useExperience((s) => s.setProgress);
  const setLocalProgress = useExperience((s) => s.setLocalProgress);
  const reducedMotion = useExperience((s) => s.reducedMotion);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    if (!sections.length) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => setProgress(self.progress),
      });

      sections.forEach((section, sectionIndex) => {
        const scene = section.dataset.scene as ExperienceScene;
        const copy = section.querySelector<HTMLElement>(".experience-copy");
        const revealItems = copy
          ? Array.from(copy.children).filter((node): node is HTMLElement => node instanceof HTMLElement)
          : [];

        ScrollTrigger.create({
          trigger: section,
          start: "top 62%",
          end: "bottom 38%",
          onEnter: () => setScene(scene),
          onEnterBack: () => setScene(scene),
          onUpdate: (self) => {
            if (self.isActive) setLocalProgress(self.progress);
          },
        });

        if (reducedMotion || media.matches || !copy) {
          gsap.set(revealItems, { clearProps: "all", opacity: 1, y: 0, x: 0, scale: 1 });
          return;
        }

        const fromX = section.classList.contains("align-right") ? 42 : -42;
        gsap.fromTo(
          revealItems,
          { opacity: 0, y: 28, x: fromX * 0.25 },
          {
            opacity: 1,
            y: 0,
            x: 0,
            duration: 0.82,
            stagger: 0.075,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: sectionIndex === 0 ? "top 92%" : "top 70%",
              toggleActions: "play none none reverse",
            },
          },
        );

        const cards = section.querySelectorAll<HTMLElement>(
          ".pain-grid article, .industry-card, .insight-stack article, .command-preview > div, .hero-proof > span",
        );
        if (cards.length) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 24, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.58,
              stagger: 0.055,
              ease: "power2.out",
              scrollTrigger: {
                trigger: section,
                start: "top 58%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        if (sectionIndex > 0) {
          gsap.fromTo(
            section,
            { "--scene-glow": 0 } as gsap.TweenVars,
            {
              "--scene-glow": 1,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "center center",
                scrub: 0.6,
              },
            } as gsap.TweenVars,
          );
        }
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh, { once: true });
    const refreshTimer = window.setTimeout(refresh, 300);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("load", refresh);
      ctx.revert();
    };
  }, [reducedMotion, setLocalProgress, setProgress, setScene]);

  return null;
}
