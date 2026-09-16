"use client";

import type { CSSProperties, ReactNode } from "react";
import { useExperience } from "@/lib/experience";
import styles from "./CinematicWorld.module.css";

type Scene = {
  label: string;
  eyebrow: string;
  image: string;
  align: "left" | "right" | "center";
  surface: ReactNode;
};

const sceneImages = {
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2400&q=90",
  table: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=2400&q=90",
  kitchen: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=2400&q=90",
  inventory: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2400&q=90",
  dish: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2400&q=90",
  hospitality: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=2400&q=90",
  property: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2400&q=90",
};

const clamp = (value:number,min=0,max=1) => Math.min(max,Math.max(min,value));

function HeroPulse(){
  return <Surface title="Owner pulse" badge="DEMO OUTLET">
    <div className={styles.metricGrid}>
      <Metric label="Gross sales" value="₹1,84,260" delta="+8.4%"/>
      <Metric label="Food cost" value="31.2%" delta="Target 30%"/>
      <Metric label="Live tables" value="18" delta="6 ordering"/>
      <Metric label="Est. contribution" value="₹82,640" delta="Illustrative"/>
    </div>
    <div className={styles.pulseRow}><span>Guest</span><i/><span>Kitchen</span><i/><span>Stock</span><i/><span>Payment</span><i/><strong>Profit</strong></div>
  </Surface>;
}

function OrderSurface(){
  return <Surface title="Table 12 · Guest ordering" badge="LIVE FLOW">
    <div className={styles.orderLayout}>
      <div className={styles.menuColumn}>
        <div className={styles.menuTop}><span>Popular tonight</span><b>3 items</b></div>
        <MenuRow name="Smoked Paneer Bowl" note="Chef special · 18 min" price="₹420" qty="1"/>
        <MenuRow name="Truffle Mushroom Flatbread" note="Bestseller · veg" price="₹510" qty="2"/>
        <MenuRow name="Cold Brew Tiramisu" note="New · dessert" price="₹290" qty="1"/>
      </div>
      <div className={styles.cartColumn}>
        <small>TABLE 12</small><strong>₹1,730</strong><span>4 items · taxes calculated at billing</span>
        <button tabIndex={-1}>Send order to kitchen</button>
      </div>
    </div>
  </Surface>;
}

function KitchenSurface(){
  return <Surface title="Kitchen display" badge="KDS">
    <div className={styles.kdsGrid}>
      <KdsCard id="#1048" table="T12" time="02:18" items={["2 × Flatbread","1 × Paneer Bowl"]} state="Preparing"/>
      <KdsCard id="#1049" table="T07" time="01:06" items={["1 × Pasta","2 × Lemon Soda"]} state="New"/>
      <KdsCard id="#1046" table="T03" time="08:41" items={["2 × Tikka","1 × Tiramisu"]} state="Ready"/>
    </div>
    <div className={styles.surfaceFoot}><span>Orders keep one identity from table to kitchen.</span><b>Avg. prep 12m 34s</b></div>
  </Surface>;
}

function InventorySurface(){
  return <Surface title="Inventory & variance" badge="STOCK">
    <div className={styles.stockHeader}><span>Ingredient</span><span>Theoretical</span><span>Physical</span><span>Variance</span></div>
    <StockRow name="Mozzarella" theoretical="8.6 kg" physical="7.9 kg" variance="−0.7 kg" alert/>
    <StockRow name="Paneer" theoretical="11.4 kg" physical="11.1 kg" variance="−0.3 kg"/>
    <StockRow name="Tomato puree" theoretical="14.2 L" physical="14.0 L" variance="−0.2 L"/>
    <StockRow name="Coffee beans" theoretical="5.1 kg" physical="5.0 kg" variance="−0.1 kg"/>
    <div className={styles.surfaceFoot}><span>Recipe deductions ≠ physical count. Munaffa keeps both visible.</span><b>3 low-stock signals</b></div>
  </Surface>;
}

function RecipeSurface(){
  return <Surface title="Dish economics" badge="RECIPE COST">
    <div className={styles.recipeLayout}>
      <div className={styles.dishVisual} style={{backgroundImage:`url(${sceneImages.dish})`}}><span>Smoked Paneer Bowl</span></div>
      <div className={styles.costStack}>
        <CostLine label="Paneer · 160 g" value="₹61"/>
        <CostLine label="Sauce + produce" value="₹29"/>
        <CostLine label="Packaging / garnish" value="₹12"/>
        <CostLine label="Allocated recipe cost" value="₹20"/>
        <div className={styles.costTotal}><span>Theoretical food cost</span><b>₹122</b></div>
        <div className={styles.marginLine}><span>Selling price ₹420</span><strong>₹298 gross contribution*</strong></div>
      </div>
    </div>
    <div className={styles.disclaimer}>*Illustrative recipe economics for the demo outlet; excludes taxes and other operating costs.</div>
  </Surface>;
}

function BillingSurface(){
  return <Surface title="Billing & payment" badge="POS FLOW">
    <div className={styles.billLayout}>
      <div className={styles.billReceipt}>
        <div><span>Table 12</span><b>#INV-12048</b></div>
        <p><span>Subtotal</span><b>₹1,730</b></p><p><span>Taxes</span><b>₹86.50</b></p><p><span>Discount</span><b>−₹100</b></p>
        <strong><span>Payable</span><b>₹1,716.50</b></strong>
      </div>
      <div className={styles.payModes}>
        <button tabIndex={-1}><span>UPI</span><b>Selected</b></button>
        <button tabIndex={-1}><span>Card</span><b>Available</b></button>
        <button tabIndex={-1}><span>Cash</span><b>Available</b></button>
        <div className={styles.paidState}><i/> Payment recorded · order closed</div>
      </div>
    </div>
  </Surface>;
}

function CrmSurface(){
  return <Surface title="Guest memory" badge="CRM">
    <div className={styles.crmLayout}>
      <div className={styles.guestProfile}><div className={styles.avatar}>AK</div><div><small>RETURNING GUEST</small><strong>Aarav K.</strong><span>6 visits · ₹8,940 lifetime spend</span></div></div>
      <div className={styles.crmSignals}>
        <p><span>Favourite</span><b>Truffle Flatbread</b></p>
        <p><span>Last feedback</span><b>4.8 / 5 · “fast service”</b></p>
        <p><span>Visit pattern</span><b>Fri–Sun evenings</b></p>
      </div>
      <div className={styles.crmAction}><span>Next best action</span><b>Invite back with dessert reward after 21 days</b></div>
    </div>
  </Surface>;
}

function ProfitSurface(){
  const bars=[62,78,68,84,73,90,82,96,88,100,93,104];
  return <Surface title="Profit intelligence" badge="OWNER VIEW">
    <div className={styles.profitLayout}>
      <div className={styles.profitNumbers}>
        <Metric label="Revenue" value="₹1.84L" delta="Today"/>
        <Metric label="Theoretical food cost" value="₹57.5K" delta="31.2%"/>
        <Metric label="Waste + variance" value="₹4,860" delta="Exposure"/>
        <Metric label="Est. contribution" value="₹82.6K" delta="Illustrative"/>
      </div>
      <div className={styles.profitChart}><div className={styles.chartLabel}><span>Contribution trend</span><b>12 service windows</b></div><div className={styles.bars}>{bars.map((h,i)=><i key={i} style={{height:`${h/1.15}%`}}/>)}</div></div>
      <div className={styles.leakageList}><p><i className={styles.dangerDot}/><span>Recipe vs physical stock variance</span><b>₹2,140</b></p><p><i className={styles.warnDot}/><span>Waste events</span><b>₹1,620</b></p><p><i className={styles.softDot}/><span>Discount leakage</span><b>₹1,100</b></p></div>
    </div>
  </Surface>;
}

function SystemSurface(){
  const modules=["Guest ordering","Waiter","Kitchen / KDS","Recipes","Inventory","Purchasing","Billing","CRM","Profit intelligence"];
  return <Surface title="Munaffa Restaurant Profit OS" badge="ONE OPERATING LAYER">
    <div className={styles.osGrid}>{modules.map((module,index)=><div key={module} className={styles.osModule}><small>{String(index+1).padStart(2,"0")}</small><b>{module}</b><span>{index<modules.length-1?"Connected":"Owner decision layer"}</span></div>)}</div>
    <div className={styles.osFooter}><span>Guest → order → kitchen → stock → payment → guest memory → profit</span><strong>One shared operational story.</strong></div>
  </Surface>;
}

function Surface({title,badge,children}:{title:string;badge:string;children:ReactNode}){
  return <div className={styles.surface}>
    <header><div><span className={styles.surfaceMark}>M</span><div><small>MUNAFFA</small><strong>{title}</strong></div></div><b>{badge}</b></header>
    <section>{children}</section>
  </div>;
}

function Metric({label,value,delta}:{label:string;value:string;delta:string}){return <div className={styles.metric}><span>{label}</span><b>{value}</b><small>{delta}</small></div>}
function MenuRow({name,note,price,qty}:{name:string;note:string;price:string;qty:string}){return <div className={styles.menuRow}><div><b>{name}</b><small>{note}</small></div><span>{price}</span><em>× {qty}</em></div>}
function KdsCard({id,table,time,items,state}:{id:string;table:string;time:string;items:string[];state:string}){return <article className={styles.kdsCard}><header><b>{id}</b><span>{table}</span><time>{time}</time></header>{items.map(item=><p key={item}>{item}</p>)}<footer>{state}</footer></article>}
function StockRow({name,theoretical,physical,variance,alert=false}:{name:string;theoretical:string;physical:string;variance:string;alert?:boolean}){return <div className={`${styles.stockRow} ${alert?styles.stockAlert:""}`}><b>{name}</b><span>{theoretical}</span><span>{physical}</span><em>{variance}</em></div>}
function CostLine({label,value}:{label:string;value:string}){return <p className={styles.costLine}><span>{label}</span><b>{value}</b></p>}

const scenes:Scene[] = [
  {label:"Profit OS",eyebrow:"OWNER PULSE",image:sceneImages.restaurant,align:"right",surface:<HeroPulse/>},
  {label:"Guest ordering",eyebrow:"TABLE 12",image:sceneImages.table,align:"left",surface:<OrderSurface/>},
  {label:"Kitchen",eyebrow:"ORDER EXECUTION",image:sceneImages.kitchen,align:"right",surface:<KitchenSurface/>},
  {label:"Inventory",eyebrow:"STOCK CONTROL",image:sceneImages.inventory,align:"left",surface:<InventorySurface/>},
  {label:"Recipe economics",eyebrow:"DISH COST",image:sceneImages.dish,align:"right",surface:<RecipeSurface/>},
  {label:"Billing",eyebrow:"PAYMENT",image:sceneImages.property,align:"left",surface:<BillingSurface/>},
  {label:"CRM",eyebrow:"GUEST MEMORY",image:sceneImages.hospitality,align:"right",surface:<CrmSurface/>},
  {label:"Profit intelligence",eyebrow:"LEAKAGE VISIBILITY",image:sceneImages.restaurant,align:"left",surface:<ProfitSurface/>},
  {label:"Munaffa OS",eyebrow:"CONNECTED SYSTEM",image:sceneImages.property,align:"center",surface:<SystemSurface/>},
];

export function CinematicWorld(){
  const progress=useExperience(state=>state.progress);
  const pointerX=useExperience(state=>state.pointerX);
  const pointerY=useExperience(state=>state.pointerY);
  const reducedMotion=useExperience(state=>state.reducedMotion);
  const scaled=progress*(scenes.length-1);
  const active=Math.min(scenes.length-1,Math.max(0,Math.round(scaled)));

  return <div className={styles.stage} aria-hidden="true">
    <div className={styles.perspectiveWorld}>
      {scenes.map((scene,index)=>{
        const phase=scaled-index;
        const distance=Math.abs(phase);
        const visible=clamp(1-distance*1.22);
        const direction=phase>=0?1:-1;
        const z=reducedMotion?0:(phase<0?-560*distance:330*distance);
        const x=reducedMotion?0:(scene.align==="left"?-1:scene.align==="right"?1:0)*distance*8 + pointerX*visible*1.1;
        const y=reducedMotion?0:pointerY*visible*.8 + direction*distance*1.8;
        const rotateY=reducedMotion?0:(scene.align==="left"?4:scene.align==="right"?-4:0)*distance + pointerX*visible*-1.3;
        const scale=reducedMotion?1:(phase<0?1-distance*.06:1+distance*.08);
        const blur=reducedMotion?0:Math.min(14,distance*10);
        const style={
          opacity:visible,
          transform:`translate3d(${x}vw,${y}vh,${z}px) rotateY(${rotateY}deg) scale(${scale})`,
          filter:`blur(${blur}px)`,
          zIndex:100-index,
          pointerEvents:"none",
        } satisfies CSSProperties;
        const photoStyle={backgroundImage:`url(${scene.image})`,transform:`scale(${1.05+visible*.035}) translate3d(${pointerX*visible*-0.5}%,${pointerY*visible*.35}%,0)`} satisfies CSSProperties;
        return <article className={`${styles.scene} ${styles[scene.align]}`} style={style} key={scene.label}>
          <div className={styles.photo} style={photoStyle}/>
          <div className={styles.photoShade}/><div className={styles.lightLeak}/>
          <div className={styles.sceneEyebrow}><span>{String(index+1).padStart(2,"0")}</span><b>{scene.eyebrow}</b></div>
          <div className={styles.surfaceWrap}>{scene.surface}</div>
        </article>;
      })}
    </div>
    <div className={styles.flowRail}><span>GUEST</span><i/><span>ORDER</span><i/><span>KITCHEN</span><i/><span>STOCK</span><i/><span>PAYMENT</span><i/><span>CRM</span><i/><strong>PROFIT</strong></div>
    <div className={styles.atmosphere}/><div className={styles.grain}/><div className={styles.vignette}/>
    <div className={styles.sceneLabel}><span>{String(active+1).padStart(2,"0")}</span><b>{scenes[active].label}</b></div>
  </div>;
}
