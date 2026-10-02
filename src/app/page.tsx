import Link from "next/link";
import { ArrowUpRight, CircleCheck } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col sm:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link
            className="text-sm font-black tracking-[0.16em]"
            href="/"
            aria-label="GHOSTED preview home"
          >
            GHOSTED
          </Link>
          <span className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold tracking-wide text-muted">
            UI PREVIEW · FICTIONAL DATA
          </span>
        </header>

        <section className="grid flex-1 content-center gap-10 py-16 md:grid-cols-[1.2fr_0.8fr] md:items-center md:gap-16 md:py-24">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-2 text-xs font-bold uppercase tracking-[0.12em]">
              <CircleCheck aria-hidden="true" size={15} strokeWidth={2.5} />
              Preview foundation ready
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-7xl">
              A keyless start for what comes next.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              GHOSTED runs locally without AI or database credentials. Product
              flows and external connections are reserved for later work.
            </p>
            <Link
              className="mt-9 inline-flex min-h-12 items-center gap-3 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-page transition-colors hover:bg-[#3b3b32]"
              href="/sandbox"
            >
              Open the Stage 2 shell
              <ArrowUpRight aria-hidden="true" size={17} />
            </Link>
          </div>

          <aside className="rounded-[2rem] border border-line bg-card p-6 shadow-[0_18px_60px_rgba(48,43,29,0.08)] sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
              Local preview
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="size-3 rounded-full bg-[#778d25]" />
              <p className="text-lg font-semibold">Ready without secrets</p>
            </div>
            <div className="mt-7 border-t border-line pt-5">
              <p className="text-sm leading-6 text-muted">
                This page and the health route are the complete Stage 1 runtime
                surface. The sandbox is an empty route shell.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2" aria-label="Stage 1 checks">
              <span className="rounded-full bg-page px-3 py-1.5 text-xs font-medium">App Router</span>
              <span className="rounded-full bg-page px-3 py-1.5 text-xs font-medium">Strict TypeScript</span>
              <span className="rounded-full bg-page px-3 py-1.5 text-xs font-medium">Local tests</span>
            </div>
          </aside>
        </section>

        <footer className="flex flex-col gap-2 border-t border-line pt-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>UI fixture only · no AI, database, upload, or participant data</span>
          <span>Built for local development</span>
        </footer>
      </div>
    </main>
  );
}
