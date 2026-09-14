import { notFound } from "next/navigation";
import { AuthFlow } from "@/components/AuthFlow";

const modes = ["sign-in", "sign-up", "forgot-password"] as const;
export default async function AuthPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!modes.includes(mode as (typeof modes)[number])) notFound();
  return <AuthFlow mode={mode as (typeof modes)[number]} />;
}
