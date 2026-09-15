import { NextRequest, NextResponse } from "next/server";
import { requireLocation, requireWorkspace, handleWorkspaceError } from "@/lib/server/workspace";
import { ensureWorkspaceIndexes } from "@/lib/server/workspaceIndexes";

const DAY=86_400_000;
function safeDays(value:string|null){const n=Number(value||30);return Number.isFinite(n)?Math.min(Math.max(Math.trunc(n),1),365):30}

export async function GET(request:NextRequest){
 try{
  const {db,user,orgId}=await requireWorkspace(request);
  if(!["owner","manager","cashier"].includes(user.role))return NextResponse.json({error:"Finance access required."},{status:403});
  const locationId=request.nextUrl.searchParams.get("locationId")||"";
  const location=await requireLocation(db,orgId,locationId);
  await ensureWorkspaceIndexes(db);
  const days=safeDays(request.nextUrl.searchParams.get("days"));
  const since=new Date(Date.now()-days*DAY);
  const rows=await db.collection("financeEvents").find({orgId,locationId:location._id,createdAt:{$gte:since}}).sort({createdAt:-1}).limit(2000).toArray();
  let revenue=0,estimatedCogs=0,expenses=0;
  const daily=new Map<string,{date:string;revenue:number;estimatedCogs:number;expenses:number}>();
  for(const row of rows){
   const amount=Number(row.amount||0);const cogs=Number(row.estimatedCogs||0);const date=(row.createdAt instanceof Date?row.createdAt:new Date(String(row.createdAt))).toISOString().slice(0,10);
   const bucket=daily.get(date)||{date,revenue:0,estimatedCogs:0,expenses:0};
   if(row.kind==="revenue"){revenue+=amount;estimatedCogs+=cogs;bucket.revenue+=amount;bucket.estimatedCogs+=cogs}else if(row.kind==="expense"){expenses+=amount;bucket.expenses+=amount}
   daily.set(date,bucket);
  }
  const grossContribution=revenue-estimatedCogs;
  const operatingContribution=grossContribution-expenses;
  return NextResponse.json({period:{days,since:since.toISOString()},summary:{revenue,estimatedCogs,expenses,grossContribution,operatingContribution,grossMarginPct:revenue>0?(grossContribution/revenue)*100:null},daily:[...daily.values()].sort((a,b)=>a.date.localeCompare(b.date)),events:rows.slice(0,100).map(row=>({id:String(row._id),kind:row.kind,amount:Number(row.amount||0),estimatedCogs:Number(row.estimatedCogs||0),sourceType:row.sourceType||null,sourceId:row.sourceId?String(row.sourceId):null,createdAt:row.createdAt}))});
 }catch(error){const e=handleWorkspaceError(error);return NextResponse.json({error:e.message},{status:e.status})}
}
