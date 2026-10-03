"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { shopperCopy } from "../copy/copy";
import styles from "./OneMove.module.css";

type GameShellProps = {
  children: ReactNode;
  onHome?: () => void;
  badge?: string | null;
};

export function GameShell({ children, onHome, badge = shopperCopy.rehearsalBadge }: GameShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        {onHome ? (
          <button className={`${styles.brand} ${styles.buttonQuiet}`} type="button" onClick={onHome}>
            ONE MOVE
          </button>
        ) : (
          <Link className={styles.brand} href="/play" aria-label="ONE MOVE home">
            ONE MOVE
          </Link>
        )}
        {badge ? (
          <div className={styles.headerMeta}>
            <span className={styles.rehearsalBadge}>{badge}</span>
          </div>
        ) : null}
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
