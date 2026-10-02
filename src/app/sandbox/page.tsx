import Link from "next/link";

export default function SandboxPage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-4xl flex-col sm:min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between border-b border-line pb-5">
          <Link className="text-sm font-black tracking-[0.16em]" href="/">
            GHOSTED
          </Link>
          <span className="rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold tracking-wide text-muted">
            UI PREVIEW · FICTIONAL DATA
          </span>
        </header>

        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            Stage 2 shell
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
            Preview space reserved.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            The component preview has not been built. This route is an empty
            shell for the next approved stage. It contains no AI result.
          </p>
          <Link
            className="mt-8 inline-flex min-h-11 w-fit items-center rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold hover:border-ink"
            href="/"
          >
            Back to the preview
          </Link>
        </section>
      </div>
    </main>
  );
}
