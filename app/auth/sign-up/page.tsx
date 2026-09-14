import type { Metadata } from "next";
import { AuthPortal } from "@/components/AuthPortal";
export const metadata:Metadata={title:"Munaffa — Create owner account",description:"Create a production Munaffa owner workspace.",robots:{index:false,follow:false}};
export default function SignUpPage(){return <AuthPortal mode="sign-up"/>}
