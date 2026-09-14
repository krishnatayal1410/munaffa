import type { ReactNode } from "react";

export function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <main style={{minHeight:"100vh",background:"#070706",color:"#f4efe6",padding:"96px max(6vw,24px)"}}>
    <a href="/" style={{fontSize:10,letterSpacing:".12em",color:"#e3b75f"}}>← MUNAFFA</a>
    <article style={{maxWidth:760,margin:"80px auto 0"}}>
      <span style={{fontSize:9,letterSpacing:".16em",color:"#e3b75f"}}>{eyebrow}</span>
      <h1 style={{fontFamily:"Georgia,serif",fontSize:"clamp(54px,8vw,96px)",fontWeight:400,lineHeight:.95,letterSpacing:"-.05em",margin:"18px 0 36px"}}>{title}</h1>
      <div style={{fontSize:14,lineHeight:1.8,color:"rgba(255,255,255,.62)"}}>{children}</div>
    </article>
  </main>;
}
