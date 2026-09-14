import { notFound } from "next/navigation";
import { AuthFlow, type AuthMode } from "@/components/AuthFlow";

const modes: AuthMode[] = ["sign-in", "sign-up", "forgot-password", "update-password"];

export default async function AuthPage({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!modes.includes(mode as AuthMode)) notFound();
  return <AuthFlow mode={mode as AuthMode} />;
}
