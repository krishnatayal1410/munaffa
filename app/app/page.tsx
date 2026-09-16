import type { Metadata } from "next";
import { DemoSyncBridge } from "@/components/DemoSyncBridge";
import { WorkspaceApp } from "@/components/WorkspaceApp";

export const metadata: Metadata = {
  title: "Munaffa OS — Restaurant Operations & Profit Workspace",
  description: "Interactive Munaffa workspace connecting restaurant operations, inventory, guest activity and profit visibility."
};

export default function WorkspacePage(){return <><DemoSyncBridge/><WorkspaceApp/></>}
