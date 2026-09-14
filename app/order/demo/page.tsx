import type { Metadata } from "next";
import { GuestOrderDemo } from "@/components/GuestOrderDemo";

export const metadata:Metadata={title:"Munaffa Guest Ordering Demo",description:"App-free guest ordering prototype connected to the Munaffa meeting workspace."};
export default function GuestOrderPage(){return <GuestOrderDemo/>}
