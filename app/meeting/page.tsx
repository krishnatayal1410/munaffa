import type { Metadata } from "next";
import { MeetingBrief } from "@/components/MeetingBrief";

export const metadata:Metadata={title:"Munaffa — Business Meeting Mode",description:"Research-first Munaffa startup brief with product, business model, roadmap and live demo links."};
export default function MeetingPage(){return <MeetingBrief/>}
