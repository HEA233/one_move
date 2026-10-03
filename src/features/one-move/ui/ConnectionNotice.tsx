"use client";

import { shopperCopy } from "../copy/copy";
import styles from "./OneMove.module.css";

type ConnectionNoticeProps = {
  onRetry?: () => void;
  message?: string;
};

export function ConnectionNotice({ onRetry, message = shopperCopy.reconnecting }: ConnectionNoticeProps) {
  return (
    <div className={styles.connectionNotice} role="alert">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          {shopperCopy.retry}
        </button>
      ) : null}
    </div>
  );
}
