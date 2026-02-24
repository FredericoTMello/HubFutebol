import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "default",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "default" && "bg-brand-600 text-white hover:bg-brand-700",
        variant === "secondary" && "bg-white text-ink hover:bg-slate-100",
        variant === "outline" && "border border-slate-300 bg-white text-ink hover:bg-slate-50",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-14 px-5 text-base",
        className
      )}
      {...props}
    />
  );
}

