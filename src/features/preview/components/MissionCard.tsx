import type { ReactNode } from "react";
import { Check } from "lucide-react";

type MissionCardProps = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
};

export function MissionCard({ id, title, description, icon, selected, disabled = false, onSelect }: MissionCardProps) {
  return (
    <button
      className={`mission-card${selected ? " mission-card--selected" : ""}`}
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={() => onSelect(id)}
    >
      <span className="mission-card-icon" aria-hidden="true">{icon}</span>
      <span className="mission-card-copy">
        <span className="mission-card-title">{title}</span>
        <span className="mission-card-description">{description}</span>
      </span>
      <span className="mission-card-check" aria-hidden="true">
        <Check size={15} strokeWidth={2.4} />
      </span>
    </button>
  );
}
