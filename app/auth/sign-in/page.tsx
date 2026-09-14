import type { Metadata } from "next";
import { AuthPortal } from "@/components/AuthPortal";
export const metadata:Metadata={title:"Munaffa — Sign in",description:"Sign in to a production Munaffa owner workspace.",robots:{index:false,follow:false}};
export default function SignInPage(){return <AuthPortal mode="sign-in"/>}
