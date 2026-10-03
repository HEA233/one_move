import Link from "next/link";
import { AppShell } from "./AppShell";

export function CoreWorkflowPlaceholder({ title }: { title: string }) {
  return <AppShell><section className="scene-intro">
    <h1>{title}</h1>
    <p>Core workflow will be implemented during EAT_HACK</p>
    <Link className="scene-back-link" href="/sandbox">Explore the independent previews</Link>
  </section></AppShell>;
}
