import type { Metadata } from "next";
import { ShopperExperience } from "@/features/one-move/shopper/ShopperExperience";

export const metadata: Metadata = {
  title: "ONE MOVE | Human Truth",
  description: "Two drinks. One little detour.",
};

export default function PlayPage() {
  return <ShopperExperience />;
}
