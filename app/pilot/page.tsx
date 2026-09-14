import type { Metadata } from "next";
import { PilotRequest } from "@/components/PilotRequest";

export const metadata:Metadata={title:"Munaffa — Request a Pilot",description:"Request a design-partner pilot for the Munaffa hospitality profit operating system."};
export default function PilotPage(){return <PilotRequest/>}
