import Link from "next/link";
import type { ReactNode } from "react";
import { PreviewBadge } from "./PreviewBadge";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="preview-shell">
      <a className="preview-skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="preview-header preview-container">
        <Link className="preview-wordmark" href="/" aria-label="GHOSTED home">
          GHOSTED
        </Link>
      </header>
      <div className="preview-sticky-strip">
        <div className="preview-container preview-sticky-inner">
          <PreviewBadge />
        </div>
      </div>
      <main className="preview-container preview-main" id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="preview-footer preview-container">
        Independent previews. No participant data is saved.
      </footer>
    </div>
  );
}
