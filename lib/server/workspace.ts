import { ObjectId, type Db } from "mongodb";
import type { NextRequest } from "next/server";
import { getRequestUser } from "./auth";
import { getMongoDb, isMongoConfigured } from "./mongodb";

export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function objectId(value:string,label="id"){if(!ObjectId.isValid(value))throw new HttpError(400,`Invalid ${label}`);return new ObjectId(value)}

function requireTrustedMutation(request:NextRequest){
 if(["GET","HEAD","OPTIONS"].includes(request.method))return;
 const fetchSite=request.headers.get("sec-fetch-site");
 if(fetchSite==="cross-site")throw new HttpError(403,"Cross-site request rejected.");
 const origin=request.headers.get("origin");
 if(origin){
  let supplied:URL;try{supplied=new URL(origin)}catch{throw new HttpError(403,"Invalid request origin.")}
  const forwardedHost=request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host=forwardedHost||request.headers.get("host")||request.nextUrl.host;
  const forwardedProto=request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol=forwardedProto||request.nextUrl.protocol.replace(":","");
  if(supplied.host!==host||supplied.protocol!==`${protocol}:`)throw new HttpError(403,"Cross-origin request rejected.");
 }
}

export async function requireWorkspace(request:NextRequest){
 requireTrustedMutation(request);
 if(!isMongoConfigured())throw new HttpError(503,"Production persistence is not configured.");
 const user=await getRequestUser(request);if(!user)throw new HttpError(401,"Authentication required.");
 const db=await getMongoDb();const orgId=objectId(user.orgId,"organisation");return{db,user,orgId};
}

export async function requireLocation(db:Db,orgId:ObjectId,locationId:string){
 const _id=objectId(locationId,"location");const location=await db.collection("locations").findOne({_id,orgId});if(!location)throw new HttpError(404,"Location not found.");return location;
}

export function handleWorkspaceError(error:unknown){
 if(error instanceof HttpError)return{status:error.status,message:error.message};
 console.error("workspace api failed",error);return{status:500,message:"Unable to complete workspace request."};
}
