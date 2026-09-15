import type { Metadata } from "next";
import { DemoSyncBridge } from "@/components/DemoSyncBridge";
import { GuestOrderDemo } from "@/components/GuestOrderDemo";

export const metadata: Metadata = {
  title: "Munaffa Guest Ordering",
  description: "App-free guest ordering connected to the Munaffa hospitality operating system."
};

export default function GuestOrderingPage(){
  return <><DemoSyncBridge/><GuestOrderDemo/></>;
}
