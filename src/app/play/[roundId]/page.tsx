import type { Metadata } from "next";
import { ShopperExperience } from "@/features/one-move/shopper/ShopperExperience";

export const metadata: Metadata = {
  title: "ONE MOVE | Human Truth",
  description: "Two drinks. One little detour.",
};

export default async function PlayRoundPage({ params }: { params: Promise<{ roundId: string }> }) {
  const { roundId } = await params;
  return <ShopperExperience roundId={roundId} />;
}
