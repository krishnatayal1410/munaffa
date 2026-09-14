import type { Metadata } from "next";
import { GuestQrDemo } from "@/components/GuestQrDemo";

export const metadata:Metadata={title:"Munaffa — Guest QR Demo",description:"Scannable app-free ordering entry point for the Munaffa business meeting prototype.",robots:{index:false,follow:false}};
export default function GuestQrPage(){return <GuestQrDemo/>}
