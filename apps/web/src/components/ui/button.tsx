import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib.ts";

type Variant = "primary" | "send" | "outline" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-ink",
  send: "bg-send text-white hover:brightness-110",
  outline: "border border-line bg-surface text-ink hover:bg-canvas",
  ghost: "text-muted hover:bg-canvas hover:text-ink",
};

export function Button({
  variant = "outline",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
