"use client";

import { ArrowDown, ArrowRight, CircleDollarSign, CookingPot, CreditCard, PackageSearch, QrCode, Sparkles, UtensilsCrossed } from "lucide-react";
import { useRef } from "react";
import { ScrollDirector } from "@/components/ScrollDirector";
import { WorldCanvas } from "@/components/WorldCanvas";
import { ProfitSimulator } from "@/components/ProfitSimulator";
import { useExperience } from "@/lib/experience";

const image = (url: string) => ({ backgroundImage: `url(${url})` });

export function ImmersiveHome() {
  const shell = useRef<HTMLElement>(null);

  function trackPointer(event: React.PointerEvent<HTMLElement>) {
    shell.current?.style.setProperty("--mx", `${event.clientX}px`);
    shell.current?.style.setProperty("--my", `${event.clientY}px`);
  }

  return <main ref={shell} className="site-shell" onPointerMove={trackPointer} id="top">
    <ScrollDirector/>
    <WorldCanvas/>
    <div className="cursor-glow" aria-hidden="true"/>
    <SiteNav/>
    <SceneRail/>

    <div id="story" className="story">
      <section className="scene scene-hero" data-scene="0">
        <div className="cinema-bg" style={image("https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2200&q=88")}/>
        <div className="scene-grid hero-grid">
          <div className="copy-block wide">
            <span className="kicker" data-reveal>Hospitality in motion</span>
            <h1 data-reveal>Hospitality<br/>never stops<br/><em>moving.</em></h1>
            <p data-reveal>Orders. Guests. Kitchen. Inventory. Payments. Costs. Every second creates an operational signal.</p>
            <a className="text-link" href="#guest" data-reveal>Scroll into the system <ArrowDown size={15}/></a>
          </div>
          <div className="hero-aside" data-reveal><span>01</span><p>One continuous story from guest experience to profit visibility.</p></div>
        </div>
      </section>

      <section className="scene" id="guest" data-scene="1">
        <div className="cinema-bg" style={image("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2200&q=88")}/>
        <div className="scene-grid right-copy">
          <div/>
          <div className="copy-block">
            <span className="kicker" data-reveal>Guest experience</span>
            <h2 data-reveal>Every guest<br/>creates a story.</h2>
            <p data-reveal>Behind every table, room, coffee and request is a chain of operational decisions that eventually touches margin.</p>
            <div className="micro-stack" data-reveal><span>People</span><span>Places</span><span>Possibilities</span><span>Profit</span></div>
          </div>
        </div>
      </section>

      <section className="scene" data-scene="2">
        <div className="cinema-bg" style={image("https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2200&q=88")}/>
        <div className="scene-grid">
          <div className="copy-block">
            <span className="kicker" data-reveal>Ordering</span>
            <h2 data-reveal>It starts<br/>with an order.</h2>
            <p data-reveal>A scan, a tap, a waiter, a room-service request. One action begins the entire operational chain.</p>
          </div>
          <div className="floating-stage" data-reveal>
            <div className="phone-shell"><div className="phone-notch"/><small>Munaffa ordering</small><b>Table 12</b><div className="menu-line"><span>Paneer butter masala</span><strong>×1</strong></div><div className="menu-line"><span>Garlic naan</span><strong>×2</strong></div><button>Send order <ArrowRight size={13}/></button></div>
            <div className="qr-plaque"><QrCode size={42}/><span>Scan to order</span></div>
          </div>
        </div>
      </section>

      <section className="scene" data-scene="3">
        <div className="cinema-bg" style={image("https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=2200&q=88")}/>
        <div className="scene-grid right-copy">
          <div/>
          <div className="copy-block">
            <span className="kicker" data-reveal>Kitchen flow</span>
            <h2 data-reveal>From table<br/>to kitchen.</h2>
            <p data-reveal>Orders move as one service stream. The point is not another dashboard—it is fewer blind hand-offs.</p>
            <div className="glass-card live-order" data-reveal><header><i/>New order <small>2 min ago</small></header><b>Table 12</b><span>Paneer butter masala ×1</span><span>Garlic naan ×2</span><footer>Queued → Cooking → Ready</footer></div>
          </div>
        </div>
      </section>

      <section className="scene" data-scene="4">
        <div className="cinema-bg food-bg" style={image("https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=2200&q=88")}/>
        <div className="scene-grid">
          <div className="copy-block">
            <span className="kicker" data-reveal>Recipe intelligence</span>
            <h2 data-reveal>Every dish<br/>has a cost.</h2>
            <p data-reveal>Recipe standards describe what a dish should consume. They create a theoretical cost model—never a claim that every gram was physically measured.</p>
          </div>
          <div className="ingredient-orbit" data-reveal>
            <span style={{"--x":"8%","--y":"10%"} as React.CSSProperties}>Paneer <b>180g</b></span>
            <span style={{"--x":"63%","--y":"4%"} as React.CSSProperties}>Cream <b>40ml</b></span>
            <span style={{"--x":"68%","--y":"54%"} as React.CSSProperties}>Tomato <b>80g</b></span>
            <span style={{"--x":"11%","--y":"66%"} as React.CSSProperties}>Spices <b>12g</b></span>
            <strong>Theoretical<br/>plate cost</strong>
          </div>
        </div>
      </section>

      <section className="scene" data-scene="5">
        <div className="cinema-bg" style={image("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2200&q=88")}/>
        <div className="scene-grid right-copy">
          <div/>
          <div className="copy-block">
            <span className="kicker" data-reveal>Inventory</span>
            <h2 data-reveal>Inventory keeps<br/>you honest.</h2>
            <p data-reveal>Expected remaining stock and physical counts stay separate. Their difference becomes a review signal—not an accusation.</p>
            <div className="inventory-panel" data-reveal><div><span>Paneer</span><b>12.0 kg</b></div><div><span>Expected remaining</span><b>10.8 kg</b></div><div className="variance"><span>Variance to investigate</span><b>−1.2 kg</b></div></div>
          </div>
        </div>
      </section>

      <section className="scene" data-scene="6">
        <div className="cinema-bg" style={image("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=2200&q=88")}/>
        <div className="scene-grid">
          <div className="copy-block">
            <span className="kicker" data-reveal>Settlement</span>
            <h2 data-reveal>Payments<br/>close the loop.</h2>
            <p data-reveal>Revenue only becomes useful when the operating events behind it are connected to the same story.</p>
          </div>
          <div className="payment-card" data-reveal><CreditCard size={30}/><span>Recorded settlement</span><strong>₹1,245</strong><small>Table 12 · card · 8:24 PM</small><i>Captured in the operational ledger</i></div>
        </div>
      </section>

      <section className="scene scene-leak pure-scene" data-scene="7">
        <div className="scene-grid">
          <div className="copy-block wide">
            <span className="kicker danger" data-reveal>Leakage</span>
            <h2 data-reveal>But where does<br/>profit <em>leak?</em></h2>
            <p data-reveal>Waste. Stock variance. Recipe inconsistency. Slow service. Discounts. The point is visibility—then investigation.</p>
          </div>
          <div className="leak-list" data-reveal><span>Food waste</span><span>Stock variance</span><span>Recipe inconsistency</span><span>Untracked discounts</span><span>Slow service</span><b>Leakage</b></div>
        </div>
        <div className="red-haze"/>
      </section>

      <section className="scene scene-core pure-scene" id="core" data-scene="8">
        <div className="core-copy" data-reveal>
          <span className="kicker">The Munaffa Core</span>
          <h2>Connect the<br/><em>whole story.</em></h2>
          <p>Orders, kitchen, inventory, guests, payments and cost signals orbit one operating model instead of living as disconnected tabs.</p>
        </div>
        <div className="orbit-labels" aria-hidden="true"><span className="o1"><UtensilsCrossed/>Orders</span><span className="o2"><CookingPot/>Kitchen</span><span className="o3"><PackageSearch/>Inventory</span><span className="o4"><CreditCard/>Payments</span><span className="o5"><CircleDollarSign/>Profit</span><span className="o6"><Sparkles/>Signals</span></div>
      </section>

      <section className="scene scene-industries pure-scene" data-scene="9">
        <div className="scene-grid single-column">
          <div className="copy-block wide"><span className="kicker" data-reveal>Multi-hospitality</span><h2 data-reveal>Built for every<br/>hospitality rhythm.</h2><p data-reveal>The operating pattern changes by business. The need for connected visibility does not.</p></div>
          <div className="industry-strip" data-reveal>
            <Industry name="Hotel" url="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=82"/>
            <Industry name="Restaurant" url="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=82"/>
            <Industry name="Café" url="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=900&q=82"/>
            <Industry name="Resort" url="https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=82"/>
            <Industry name="QSR" url="https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=900&q=82"/>
            <Industry name="Cloud kitchen" url="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=82"/>
          </div>
        </div>
      </section>

      <section className="scene pure-scene" data-scene="10">
        <div className="scene-grid">
          <div className="copy-block"><span className="kicker" data-reveal>Command intelligence</span><h2 data-reveal>See the bigger<br/>picture.</h2><p data-reveal>Not more decoration. A product surface that traces operating signals back to the places where decisions are made.</p></div>
          <div className="command-panel" data-reveal>
            <header><span>Illustrative workspace preview</span><i>Live model</i></header>
            <div className="command-flow"><b>Order</b><em>→</em><b>Recipe</b><em>→</em><b>Inventory</b><em>→</em><b>Settlement</b></div>
            <div className="command-grid"><article><small>Service</small><strong>Connected</strong><span>Order state follows the service path.</span></article><article><small>Inventory</small><strong>Explainable</strong><span>Expected stock remains distinct from physical counts.</span></article><article><small>Profit</small><strong>Traceable</strong><span>Recorded revenue and costs retain their source.</span></article></div>
          </div>
        </div>
      </section>

      <section className="scene pure-scene simulator-scene" id="simulator" data-scene="11">
        <div className="scene-grid single-column">
          <div className="copy-block wide"><span className="kicker" data-reveal>Scenario explorer</span><h2 data-reveal>What if you could<br/>see the leakage?</h2><p data-reveal>Change a few assumptions and see how quickly small percentages can become material. This is an illustration, not a savings claim.</p></div>
          <ProfitSimulator/>
        </div>
      </section>

      <section className="scene scene-final pure-scene" data-scene="12">
        <div className="final-copy" data-reveal><span className="kicker">Munaffa</span><h2>Run your business<br/>on profit, not guesswork.</h2><p>One hospitality story. One operating model. Built to make the invisible visible.</p><div><a className="primary-cta" href="#core">Enter the system <ArrowRight size={15}/></a><a className="secondary-cta" href="#top">Restart the story</a></div></div>
      </section>
    </div>

    <footer><div className="brand-mark"><b>M</b><span>Munaffa</span></div><p>Immersive homepage concept · product claims intentionally kept grounded.</p><a href="#top">Back to top ↑</a></footer>
  </main>;
}

function Industry({ name, url }: { name: string; url: string }) {
  return <article className="industry-card"><div style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(0,0,0,.78)),url(${url})` }}/><span>{name}</span></article>;
}

function SiteNav() {
  return <nav className="site-nav"><a href="#top" className="brand-mark"><b>M</b><span>Munaffa</span></a><div className="nav-links"><a href="#guest">Story</a><a href="#core">System</a><a href="#simulator">Scenario</a></div><a className="nav-cta" href="#core">Explore <ArrowRight size={13}/></a></nav>;
}

function SceneRail() {
  const scene = useExperience((state) => state.scene);
  const milestones = [0, 2, 4, 6, 7, 8, 9, 10, 11, 12];
  return <div className="scene-rail" aria-hidden="true">{milestones.map((value) => <i key={value} className={scene >= value ? "active" : ""}/>)}</div>;
}
