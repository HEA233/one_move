"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./OneMove.module.css";

type OneMoveButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  children: ReactNode;
};

export function OneMoveButton({ variant = "primary", className = "", children, type = "button", ...props }: OneMoveButtonProps) {
  const variantClass = variant === "secondary" ? styles.buttonSecondary : variant === "quiet" ? styles.buttonQuiet : "";
  return (
    <button {...props} className={`${styles.button} ${variantClass} ${className}`.trim()} type={type}>
      {children}
    </button>
  );
}
