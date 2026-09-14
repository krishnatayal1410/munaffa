"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useExperience } from "@/lib/store";

type SceneSpec = { id:string; n:string; right:boolean; kicker:string; title:string; text:string; chips:string[] };

const specs: SceneSpec[] = [
  {id:"problem",n:"02",right:true,kicker:"The hidden problem",title:"Your restaurant can be busy and still leak profit.",text:"Disconnected ordering, inventory variance, waste and delays create blind spots.",chips:["Unknown food cost","Inventory leakage","Recipe inconsistency","Delayed orders"]},
  {id:"connect",n:"03",right:false,kicker:"Munaffa connects the flow",title:"One restaurant. One operating system.",text:"Every transaction becomes part of one connected operational flow.",chips:["Customer","Order","Kitchen","Recipe","Inventory","Payment","Profit"]},
  {id:"ordering",n:"04",right:true,kicker:"Ordering",title:"Order without waiting.",text:"QR and waiter ordering feed one live table-linked order stream.",chips:["QR ordering","Waiter ordering","Live menu","Order status"]},
  {id:"kitchen",n:"05",right:false,kicker:"Kitchen display",title:"From table to kitchen. Instantly.",text:"Tickets move from New to Preparing to Ready while front-of-house sees the same truth.",chips:["NEW · Table 08","PREPARING · Table 03","READY · Table 11"]},
  {id:"inventory",n:"06",right:true,kicker:"Inventory + recipe intelligence",title:"Know what every dish should actually cost.",text:"Theoretical recipe consumption stays separate from real physical stock so variance is honest.",chips:["Paneer -180 g","Cream -20 ml","Theoretical 10.2 kg","Variance +2.2 kg"]},
  {id:"profit",n:"07",right:false,kicker:"Profit engine",title:"Revenue tells you what you sold. Munaffa tells you what you kept.",text:"Food cost, contribution, stock and operational signals become visible together.",chips:["Food Cost 31.4% · Demo","Contribution ₹214 · Demo","Inventory Days 3.8 · Demo"]},
  {id:"leakage",n:"08",right:true,kicker:"Potential anomaly",title:"Potential leakage detected.",text:"Surface signals to investigate — never accusations the system cannot prove.",chips:["Ingredient variance ↑","Food cost ↑","Waste ↑","Purchase price ↑"]},
  {id:"command",n:"09",right:false,kicker:"Owner command center",title:"Your entire restaurant. One command center.",text:"See the operational picture without jumping between disconnected systems.",chips:["Sales ₹84,520 · Demo","Live Orders 12 · Demo","Low Stock 6 items · Demo"]},
  {id:"roles",n:"10",right:true,kicker:"Role-based system",title:"The right view for every role.",text:"Each person sees only what matters to their job.",chips:["Owner","Manager","Waiter","Kitchen","Cashier","Customer"]},
  {id:"ai",n:"11",right:false,kicker:"Munaffa AI",title:"Munaffa watches the numbers. You run the restaurant.",text:"Production intelligence must be grounded in real restaurant data and validation.",chips:["Low-stock signal","Purchase-cost signal","Contribution signal","Demand signal"]},
  {id:"integrations",n:"13",right:false,kicker:"Ecosystem",title:"Works with your restaurant ecosystem.",text:"Integrations stay labelled planned until they are actually implemented.",chips:["POS","Payments","WhatsApp","Accounting","Suppliers","Delivery","Printers","QR"]},
  {id:"pricing",n:"14",right:true,kicker:"Working pricing",title:"Simple. Transparent. Built for growth.",text:"Validation pricing to test with restaurant owners before treating willingness-to-pay as proven.",chips:["Launch · ₹999/mo","Growth · ₹2,499/mo","Profit · ₹4,999/mo"]},
  {id:"final",n:"15",right:false,kicker:"The restaurant, connected",title:"Run your restaurant on profit, not guesswork.",text:"Smarter operations. Happier guests. Healthier margins.",chips:[]}
];

function Scene({spec}:{spec:SceneSpec}){
  return <section id={spec.id} data-scene={spec.id} className={`scene ${spec.right?"right":""}`}>
    <div className="scene-copy">
      <div className="eyebrow">{spec.kicker}</div>
      <h2 className="section-title">{spec.title}</h2>
      <p className="lede">{spec.text}</p>
      {spec.chips.length>0&&<div className="chips">{spec.chips.map(chip=><span key={chip} className="chip">{chip}</span>)}</div>}
      {spec.id==="final"&&<div className="mt-6 flex flex-wrap gap-3"><Link href="/contact" className="cta primary">Book Your Profit Audit</Link><Link href="/demo" className="cta secondary">See Munaffa Demo</Link></div>}
    </div>
  </section>;
}

function Simulator(){
  const setLeak=useExperience(s=>s.setLeak);
  const [sales,setSales]=useState(800000),[food,setFood]=useState(35),[variance,setVariance]=useState(3),[waste,setWaste]=useState(2);
  const leakage=useMemo(()=>sales*(food/100)*((variance+waste)/100),[sales,food,variance,waste]);
  const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
  return <section id="simulator" data-scene="simulator" className="scene right"><div className="scene-copy"><div className="eyebrow">Interactive profit leak simulator</div><h2 className="section-title">See how much profit could be slipping away.</h2><p className="lede">Illustrative calculator — not a diagnosis.</p><div className="glass rounded-[26px] p-6">
    <label className="mb-5 block text-xs">Monthly sales · {money(sales)}<input type="range" min="200000" max="5000000" step="50000" value={sales} onChange={e=>setSales(+e.target.value)}/></label>
    <label className="mb-5 block text-xs">Food cost · {food}%<input type="range" min="20" max="55" value={food} onChange={e=>setFood(+e.target.value)}/></label>
    <label className="mb-5 block text-xs">Inventory variance · {variance}%<input type="range" min="0" max="10" step="0.5" value={variance} onChange={e=>{const v=+e.target.value;setVariance(v);setLeak(Math.min(1,(v+waste)/14))}}/></label>
    <label className="mb-5 block text-xs">Waste · {waste}%<input type="range" min="0" max="10" step="0.5" value={waste} onChange={e=>{const v=+e.target.value;setWaste(v);setLeak(Math.min(1,(variance+v)/14))}}/></label>
    <div className="rounded-2xl border border-munaffa-green/20 bg-munaffa-green/5 p-4"><small className="text-white/40">Illustrative potential leakage</small><b className="block text-4xl text-munaffa-green">{money(leakage)}</b></div>
  </div></div></section>;
}

export function StoryLive(){
  return <><section id="hero" data-scene="hero" className="scene"><div className="scene-copy"><div className="eyebrow">Restaurant Profit OS</div><h1 className="hero-title">Every order should <span>make you money.</span></h1><p className="lede">Munaffa connects ordering, kitchen, inventory, billing and profit intelligence into one restaurant operating system.</p><div className="flex flex-wrap gap-3"><Link href="/contact" className="cta primary">Book a Free Profit Audit</Link><Link href="#problem" className="cta secondary">Explore Munaffa</Link></div></div></section>{specs.slice(0,10).map(spec=><Scene key={spec.id} spec={spec}/>) }<Simulator/>{specs.slice(10).map(spec=><Scene key={spec.id} spec={spec}/>)}</>;
}
