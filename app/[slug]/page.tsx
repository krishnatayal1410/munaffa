import { Subpage } from "@/components/Subpage";

const known = new Set(["product","restaurants","cafes","inventory","profit-intelligence","ordering","kitchen","crm","pricing","demo","about","contact","login","privacy","terms"]);

function label(slug:string){return slug.split("-").map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ")}

export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const title=known.has(slug)?label(slug):"Munaffa";
  return <Subpage eyebrow={title} title={`${title} — Munaffa`} description="This module is part of Munaffa's connected Restaurant Profit OS. It shares the same operating model across ordering, kitchen, inventory, guests and profit intelligence." cards={[["Connected workflow","Built to share one operational truth across the restaurant."],["Owner visibility","Designed around useful decisions rather than dashboard clutter."],["Production path","Real data, authentication and integrations are connected as the platform backend is implemented."]]}/>;
}
