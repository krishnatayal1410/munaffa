import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/server/auth";
import { getMongoDb, isMongoConfigured } from "@/lib/server/mongodb";
import { ObjectId } from "mongodb";

export const dynamic="force-dynamic";

export async function GET(request:NextRequest){
 if(!isMongoConfigured())return NextResponse.json({authenticated:false,configured:false},{headers:{"Cache-Control":"no-store"}});
 try{
  const user=await getRequestUser(request);if(!user)return NextResponse.json({authenticated:false,configured:true},{status:401,headers:{"Cache-Control":"no-store"}});
  const db=await getMongoDb();const [org,locations]=await Promise.all([db.collection("organizations").findOne({_id:new ObjectId(user.orgId)},{projection:{name:1}}),db.collection("locations").find({orgId:new ObjectId(user.orgId)}).project({name:1,type:1,city:1}).toArray()]);
  return NextResponse.json({authenticated:true,configured:true,user,organization:org?{id:String(org._id),name:String(org.name)}:null,locations:locations.map(x=>({id:String(x._id),name:String(x.name),type:String(x.type),city:String(x.city)}))},{headers:{"Cache-Control":"no-store"}});
 }catch(error){console.error("session lookup failed",error);return NextResponse.json({authenticated:false,configured:true,error:"Unable to load session."},{status:500,headers:{"Cache-Control":"no-store"}})}
}
