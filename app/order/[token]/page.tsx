import { GuestOrderExperience } from "@/components/GuestOrderExperience";

export default async function GuestOrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GuestOrderExperience token={token} />;
}
