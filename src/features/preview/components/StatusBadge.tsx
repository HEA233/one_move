import { AlertTriangle, CircleHelp, CircleX, type LucideIcon, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type StatusBadgeProps = {
  tone: "neutral" | "positive" | "warning" | "negative";
  children: string;
};

const icons: Record<StatusBadgeProps["tone"], LucideIcon> = {
  neutral: CircleHelp,
  positive: ShieldCheck,
  warning: AlertTriangle,
  negative: CircleX,
};

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  const Icon: LucideIcon = icons[tone];

  return (
    <span className={`preview-status preview-status--${tone}`}>
      <Icon aria-hidden="true" size={15} strokeWidth={2} />
      <span>{children}</span>
    </span>
  );
}

export function FixtureDisclosure({ children = "UI fixture — not an AI result" }: { children?: ReactNode }) {
  return <p className="preview-fixture-disclosure">{children}</p>;
}
