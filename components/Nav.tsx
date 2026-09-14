"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

const links=[["Product","/product"],["Restaurants","/restaurants"],["Pricing","/pricing"],["Demo","/demo"],["About","/about"]];

export function Nav(){
  const [scrolled,setScrolled]=useState(false);
  const [open,setOpen]=useState(false);
  useEffect(()=>{const f=()=>setScrolled(scrollY>24);f();addEventListener("scroll",f,{passive:true});return()=>removeEventListener("scroll",f)},[]);
  return <>
    <header className={`fixed left-1/2 top-4 z-50 flex h-[68px] w-[min(1180px,calc(100%-28px))] -translate-x-1/2 items-center justify-between rounded-[20px] px-4 transition ${scrolled?"border border-white/10 bg-[#08110c]/80 shadow-2xl backdrop-blur-2xl":""}`}>
      <Link href="/" className="flex items-center gap-2"><span className="grid size-8 -rotate-6 place-items-center rounded-[10px] bg-munaffa-green font-bold text-[#07100b]">m</span><b className="font-display text-lg">munaffa</b><span className="hidden text-[10px] text-white/40 sm:block">Restaurant Profit OS</span></Link>
      <nav className="hidden gap-7 text-[13px] text-white/70 md:flex">{links.map(([a,b])=><Link key={b} href={b} className="hover:text-munaffa-green">{a}</Link>)}</nav>
      <div className="flex items-center gap-3"><Link href="/login" className="hidden text-[13px] text-white/70 lg:block">Login</Link><Link href="/contact" className="hidden rounded-xl bg-munaffa-green px-4 py-2 text-xs font-bold text-[#07100b] sm:block">Book demo</Link><button onClick={()=>setOpen(v=>!v)} className="grid size-11 place-items-center rounded-xl bg-white/5 md:hidden" aria-label="Toggle menu">{open?<X size={18}/>:<Menu size={18}/>}</button></div>
    </header>
    {open&&<div className="fixed left-3 right-3 top-[92px] z-50 grid rounded-2xl border border-white/10 bg-[#08110c]/95 p-3 backdrop-blur-xl md:hidden">{links.map(([a,b])=><Link key={b} href={b} onClick={()=>setOpen(false)} className="rounded-xl px-4 py-3 text-sm hover:bg-white/5">{a}</Link>)}</div>}
  </>;
}
