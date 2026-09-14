import type { Metadata } from "next";
import { DemoSyncBridge } from "@/components/DemoSyncBridge";
import { WorkspaceApp } from "@/components/WorkspaceApp";

export const metadata: Metadata = {
  title: "Munaffa Workspace — Meeting Demo",
  description: "Interactive hospitality operations and profit workspace demo for Munaffa."
};

export default function WorkspacePage(){return <><DemoSyncBridge/><WorkspaceApp/></>}
