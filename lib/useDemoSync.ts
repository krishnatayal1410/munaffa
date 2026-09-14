"use client";
import { useEffect } from "react";
import { useDemoWorkspace } from "./demoWorkspace";

export function useDemoSync(){
 useEffect(()=>{
  const sync=(event:StorageEvent)=>{if(event.key==="munaffa-meeting-demo-v1") void useDemoWorkspace.persist.rehydrate()};
  window.addEventListener("storage",sync);
  return()=>window.removeEventListener("storage",sync);
 },[]);
}
