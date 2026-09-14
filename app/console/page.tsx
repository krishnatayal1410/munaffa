import type { Metadata } from "next";
import { ProductionConsole } from "@/components/ProductionConsole";
export const metadata:Metadata={title:"Munaffa — Production Console",description:"Authenticated Munaffa production workspace foundation.",robots:{index:false,follow:false}};
export default function ConsolePage(){return <ProductionConsole/>}
