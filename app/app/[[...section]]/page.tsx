import { DashboardApp } from "@/components/DashboardApp";

export default async function AppPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  return <DashboardApp section={section?.[0] || "overview"} />;
}
