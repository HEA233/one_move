import { AlertTriangle, CircleDot, Inbox } from "lucide-react";
import { Button } from "./Button";

type Action = { label: string; onClick: () => void };

type AsyncStatePanelProps =
  | { state: "idle"; title: string; description: string }
  | { state: "loading"; title: string; description: string }
  | { state: "error"; title: string; description: string; action?: Action }
  | { state: "empty"; title: string; description: string; action?: Action };

const stateIcons = {
  idle: CircleDot,
  loading: CircleDot,
  error: AlertTriangle,
  empty: Inbox,
};

export function AsyncStatePanel(props: AsyncStatePanelProps) {
  const Icon = stateIcons[props.state];
  const action: Action | undefined = "action" in props ? props.action : undefined;

  return (
    <section className={`async-panel async-panel--${props.state}`} aria-live="polite">
      <Icon className="async-panel-icon" aria-hidden="true" size={23} strokeWidth={1.8} />
      <div className="async-panel-copy">
        <h3>{props.title}</h3>
        <p>{props.description}</p>
        {action ? <Button variant="secondary" onClick={action.onClick}>{action.label}</Button> : null}
      </div>
    </section>
  );
}
