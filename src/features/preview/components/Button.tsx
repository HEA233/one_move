import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet";
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({
  variant = "primary",
  loading = false,
  loadingLabel = "Loading…",
  children,
  className = "",
  type = "button",
  disabled,
  ...buttonProps
}, ref) {
  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      className={`preview-button preview-button--${variant}${loading ? " preview-button--loading" : ""}${className ? ` ${className}` : ""}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={loading ? loadingLabel : buttonProps["aria-label"]}
    >
      <span className="preview-button-label" aria-hidden={loading || undefined}>
        {children}
      </span>
      <span className="preview-button-loading" aria-hidden="true">
        {loadingLabel}
      </span>
    </button>
  );
});
