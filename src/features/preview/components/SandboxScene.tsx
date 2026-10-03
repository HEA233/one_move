import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { FixtureDisclosure } from "./StatusBadge";

type SandboxSceneProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function SandboxScene({ title, description, children }: SandboxSceneProps) {
  return (
    <div className="sandbox-scene">
      <Link className="scene-back-link" href="/sandbox">
        <ArrowLeft aria-hidden="true" size={16} />
        <span>All scenes</span>
      </Link>
      <section className="scene-intro" aria-labelledby="scene-title">
        <h1 id="scene-title">{title}</h1>
        <p>{description}</p>
        <FixtureDisclosure />
      </section>
      {children}
    </div>
  );
}
