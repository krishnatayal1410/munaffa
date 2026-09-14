"use client";

import Link from "next/link";
import { BarChart3, BrainCircuit, Building2, Coffee, Hotel, Layers3, ShieldCheck, Sparkles, UtensilsCrossed } from "lucide-react";
import { industries } from "@/lib/content";
import { HospitalityWorld } from "./HospitalityWorld";
import { ExperienceController } from "./ExperienceController";
import { useExperience } from "@/lib/experience";

const painCards = [
  ["Food & stock variance", "Theoretical usage and physical stock drift apart."],
  ["Revenue blind spots", "Busy properties can still lose contribution through cost and process leakage."],
  ["Disconnected tools", "Bookings, orders, rooms, kitchen, inventory and guests live in separate systems."],
  ["Slow decisions", "Owners find out after the month closes instead of while they can still act."],
];

export function ImmersiveHome() {
  const reduced = useExperience((s) => s.reducedMotion);
  const toggle = useExperience((s) => s.toggleReducedMotion);

  return <>
    <HospitalityWorld />
    <ExperienceController />
    <div className="world-vignette" />
    <button className="motion-toggle" onClick={toggle}>{reduced ? "Enable motion" : "Reduce motion"}</button>
    <main className="experience-main">
      <section className="experience-scene hero-scene" data-scene="hero">
        <div className="experience-copy hero-copy">
          <span className="kicker"><Sparkles size={14}/> Hospitality Profit OS</span>
          <h1>Higher occupancy.<br/><em>Higher profits.</em></h1>
          <p>Munaffa is the AI-powered operating system for hotels, restaurants, cafés, cloud kitchens, resorts, bars and modern hospitality businesses.</p>
          <div className="cta-row"><Link className="pill primary" href="/auth/sign-up">Start free</Link><Link className="pill ghost" href="/product">Explore platform</Link></div>
          <div className="hero-proof"><span><b>One workspace</b><small>Revenue + operations + costs</small></span><span><b>Multi-industry</b><small>Hotels to cloud kitchens</small></span><span><b>AI-ready</b><small>Signals grounded in real data</small></span></div>
        </div>
        <aside className="floating-vertical-card"><small>Built for</small>{["Hotels", "Restaurants", "Cafés & QSRs", "Cloud Kitchens", "Resorts", "Bars & Lounges"].map((x) => <span key={x}>✓ {x}</span>)}</aside>
      </section>

      <section className="experience-scene align-right" data-scene="problem"><div className="experience-copy"><span className="kicker danger">The problem</span><h2>Great hospitality can still hide <em>bad economics.</em></h2><p>Munaffa starts where spreadsheets and disconnected software stop: linking what happened operationally to what happened financially.</p><div className="pain-grid">{painCards.map(([title, text]) => <article key={title}><b>{title}</b><small>{text}</small></article>)}</div></div></section>

      <section className="experience-scene" data-scene="platform"><div className="experience-copy"><span className="kicker"><Layers3 size={14}/> One platform</span><h2>Every operation.<br/><em>Connected.</em></h2><p>Bookings or orders become service activity. Service activity becomes stock and cost movement. Those movements become profit and guest signals.</p><div className="flow-strip">{["Demand", "Booking / Order", "Operations", "Inventory", "Payment", "Profit"].map((x, i) => <span key={x}>{x}{i < 5 && <i>→</i>}</span>)}</div></div></section>

      <section className="experience-scene align-right" data-scene="industries"><div className="experience-copy wide-copy"><span className="kicker"><Building2 size={14}/> Multi-hospitality</span><h2>Built for hospitality.<br/><em>Designed for growth.</em></h2><div className="industry-grid">{industries.map((item, index) => { const Icon = [Hotel, UtensilsCrossed, Coffee, UtensilsCrossed, Hotel, Coffee][index]; return <Link key={item.key} href={`/industries#${item.key}`} className="industry-card"><Icon size={18}/><b>{item.title}</b><small>{item.description}</small></Link>; })}</div></div></section>

      <section className="experience-scene" data-scene="intelligence"><div className="experience-copy"><span className="kicker"><BrainCircuit size={14}/> AI-powered intelligence</span><h2>Turn operating data into <em>decisions.</em></h2><p>Munaffa is designed to explain what changed, what might need attention and which action is worth investigating next.</p><div className="insight-stack"><article><b>Demand signal</b><span>Weekend room demand is trending above the recent baseline.</span><em>Illustrative</em></article><article><b>Cost signal</b><span>Ingredient purchase cost increased while selling price stayed flat.</span><em>Illustrative</em></article><article><b>Variance signal</b><span>Physical inventory is below theoretical stock for a high-volume ingredient.</span><em>Illustrative</em></article></div></div></section>

      <section className="experience-scene align-right" data-scene="proof"><div className="experience-copy"><span className="kicker"><BarChart3 size={14}/> Live operating view</span><h2>One command center.<br/><em>Less guesswork.</em></h2><div className="command-preview">{["Revenue", "Occupancy / Covers", "Food Cost", "Low Stock", "Guest Sentiment", "Potential Variance"].map((x, i) => <div key={x}><small>{x}</small><b>{["₹8.42L", "78%", "31.4%", "6 items", "4.6/5", "Review"][i]}</b><em>Demo</em></div>)}</div><p className="truth-note"><ShieldCheck size={14}/> Demo values are labelled. Production insights require verified business data.</p></div></section>

      <section className="experience-scene final-scene" data-scene="final"><div className="experience-copy centered"><span className="kicker">A more profitable hospitality tomorrow</span><h2>Run hospitality on <em>visibility, not guesswork.</em></h2><p>Start with a guided sample workspace, then configure your real property or outlet when you are ready.</p><div className="cta-row centered-row"><Link className="pill primary" href="/auth/sign-up">Create your workspace</Link><Link className="pill ghost" href="/auth/sign-in">Open demo</Link></div></div></section>
    </main>
  </>;
}
