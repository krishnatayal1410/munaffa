"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useExperience } from "@/lib/store";

const scenes = [
  {id:"problem",n:"02",right:true,kicker:"The hidden problem",title:"Your restaurant can be busy and still leak profit.",text:"Disconnected ordering, inventory variance, waste, recipe inconsistency and delays create blind spots.",chips:["Unknown food cost","Inventory leakage","Recipe inconsistency","Delayed orders","Disconnected systems","No real profit visibility"]},
  {id:"connect",n:"03",kicker:"Munaffa connects the flow",title:"One restaurant. One operating system.",text:"Every transaction becomes part of one connected operational flow.",chips:["Customer","Order","Kitchen","Recipe","Inventory","Payment","Profit"]},
  {id:"ordering",n:"04",right:true,kicker:"Ordering",title:"Order without waiting.",text:"QR and waiter ordering feed one live table-linked order stream.",chips:["QR ordering","Waiter ordering","Live menu","Table-linked orders","Order status"],link:"/ordering"},
  {id:"kitchen",n:"05",kicker:"Kitchen display",title:"From table to kitchen. Instantly.",text:"Tickets move from New to Preparing to Ready while front-of-house sees the same truth.",chips:["NEW · Table 08","PREPARING · Table 03","READY · Table 11"],link:"/kitchen"},
  {id:"inventory",n:"06",right:true,kicker:"Inventory + recipe intelligence",title:"Know what every dish should actually cost.",text:"Separate theoretical recipe consumption from real physical stock. The gap becomes variance.",chips:["Paneer -180 g","Yogurt -40 g","Cream -20 ml","Theoretical 10.2 kg","Actual 12.4 kg","Variance +2.2 kg"],link:"/inventory"},
  {id:"profit",n:"07",kicker:"Profit engine",title:"Revenue tells you what you sold. Munaffa tells you what you kept.",text:"Food cost, contribution, inventory days and waste signals become visible in one system.",chips:["Food Cost 31.4% · Demo","Contribution ₹214 · Demo","Waste Risk Medium · Demo","Inventory Days 3.8 · Demo"]},
  {id:"leakage",n:"08",right:true,kicker:"Potential anomaly",title:"Potential leakage detected.",text:"Munaffa surfaces signals to investigate — not accusations it cannot prove.",chips:["Ingredient variance ↑","Food cost ↑","Waste ↑","Purchase price ↑","Recipe inconsistency ↑"]},
  {id:"command",n:"09",kicker:"Owner command center",title:"Your entire restaurant. One command center.",text:"Sales, food cost, live orders, stock and operational attention points in one owner view.",chips:["Sales ₹84,520 · Demo","Food Cost 31.4% · Demo","Live Orders 12 · Demo","Low Stock 6 items · Demo"]},
  {id:"roles",n:"10",right:true,kicker:"Role-based system",title:"The right view for every role.",text:"Each person sees only what matters to their work.",chips:["Owner · Profit & analytics","Manager · Operations","Waiter · Tables & orders","Kitchen · Preparation","Cashier · Payments","Customer · Menu & feedback"]},
  {id:"ai",n:"11",kicker:"Munaffa AI",title:"Munaffa watches the numbers. You run the restaurant.",text:"Production intelligence must be grounded in real restaurant data and validated before claims are made.",chips:["Paneer stock may run low tomorrow","Purchase cost increased this week","Dish contribution has fallen","Dinner demand may be higher tonight"]},
  {id:"integrations",n:"13",kicker:"Ecosystem",title:"Works with your restaurant ecosystem.",text:"POS, payments, WhatsApp, accounting, suppliers, delivery, printers and QR — each labelled planned until it truly exists.",chips:["POS","Payments","WhatsApp","Accounting","Suppliers","Delivery","Printers","QR"]},
  {id:"pricing",n:"14",right:true,kicker:"Working pricing",title:"Simple. Transparent. Built for growth.",text:"Validation pricing to test with real owners before treating willingness-to-pay as proven.",chips:["Launch · ₹999/mo","Growth · ₹2,499/mo","Profit · ₹4,999/mo"]},
  {id:"final",n:"15",kicker:"The restaurant, connected",title:"Run your restaurant on profit, not guesswork.",text:"Smarter operations. Happier guests. Healthier margins. That's Munaffa.",chips:[]}
] as const;

function Scene({item}:{item:(typeof scenes)[number]}) {
  const parts=item.title.split(/(profit|money|operating system|waiting|Instantly|actually cost|kept|detected|command center|every role|You run the restaurant|ecosystem|Built for growth|not guesswork)/i);
  return <section id={item.id} data-scene={item.id} className={`scene ${item.right?"right":""}`}>
    <div className="scene-copy">
      <div className="eyebrow">{item.kicker}</div>
      <h2 className="section-title">{parts.map((part,index)=>/profit|money|operating system|waiting|instantly|actually cost|kept|detected|command center|every role|you run the restaurant|ecosystem|built for growth|not guesswork/i.test(part)?<span key={index}>{part}</span>:part)}</h2>
      <p className="lede">{item.text}</p>
      {item.chips.length>0&&<div className="chips">{item.chips.map((chip)=><span key={chip} className="chip">{chip}</span>)}</div>}
      {"link" in item&&item.link&&<Link className="link" href={item.link}>Explore feature →</Link>}
      {item.id==="final"&&<div className="mt-6 flex flex-wrap gap-3"><Link href="/contact" className="cta primary">Book Your Profit Audit</Link><Link href="/demo" className="cta secondary">See Munaffa Demo</Link></div>}
    </div>
    <div className={`absolute bottom-7 text-[10px] uppercase tracking-[.14em] text-white/30 ${item.right?"right-[6vw]":"left-[6vw]"}`}><span className="mr-2 text-munaffa-green">{item.n}</span>Munaffa system story</div>
  </section>;
}

function Simulator(){
  const setLeak=useExperience(s=>s.setLeak);
  const [sales,setSales]=useState(800000),[food,setFood]=useState(35),[variance,setVariance]=useState(3),[waste,setWaste]=useState(2);
  const leakage=useMemo(()=>sales*(food/100)*((variance+waste)/100),[sales,food,variance,waste]);
  const money=(value:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value);
  return <section id="simulator" data-scene="simulator" className="scene right">
    <div className="scene-copy">
      <div className="eyebrow">Interactive profit leak simulator</div>
      <h2 className="section-title">See how much profit <span>could be slipping away.</span></h2>
      <p className="lede">Illustrative calculator — not a diagnosis.</p>
      <div className="glass rounded-[26px] p-6">
        {[{label:"Monthly sales",value:sales,min:200000,max:5000000,step:50000,set:setSales,out:money(sales)},{label:"Food cost",value:food,min:20,max:55,step:1,set:setFood,out:`${food}%`},{label:"Inventory variance",value:variance,min:0,max:10,step:.5,set:(v:number)=>{setVariance(v);setLeak(Math.min(1,(v+waste)/14))},out:`${variance}%`},{label:"Waste",value:waste,min:0,max:10,step:.5,set:(v:number)=>{setWaste(v);setLeak(Math.min(1,(variance+v)/14))},out:`${waste}%`}].map(field=><label key={field.label} className="mb-5 grid grid-cols-[1fr_auto] gap-2 text-xs text-white/60"><span>{field.label}</span><b className="text-white">{field.out}</b><input className="col-span-2" type="range" min={field.min} max={field.max} step={field.step} value={field.value} onChange={e=>field.set(+e.target.value)}/></label>)}
        <div className="mb-3 rounded-2xl border border-munaffa-green/20 bg-munaffa-green/5 p-4"><small className="text-white/40">Illustrative potential leakage</small><b className="mt-1 block text-4xl text-munaffa-green">{money(leakage)}</b><span className="text-[10px] text-white/35">per month</span></div>
        <Link href="/contact" className="cta primary w-full">Analyse My Restaurant</Link>
      </div>
    </div>
  </section>;
}

export function Story(){
  const before=scenes.slice(0,10);
  const after=scenes.slice(10);
  return <>
    <section id="hero" data-scene="hero" className="scene">
      <div className="scene-copy">
        <div className="eyebrow">Restaurant Profit OS</div>
        <h1 className="hero-title">Every order should <span>make you money.</span></h1>
        <p className="lede">Munaffa connects ordering, kitchen, inventory, billing and profit intelligence into one restaurant operating system.</p>
        <div className="flex flex-wrap gap-3"><Link href="/contact" className="cta primary">Book a Free Profit Audit</Link><Link href="#problem" className="cta secondary">Explore Munaffa</Link></div>
      </div>
    </section>
    {before.map(item=><Scene key={item.id} item={item}/>)}
    <Simulator/>
    {after.map(item=><Scene key={item.id} item={item}/>)}
  </>;
}
