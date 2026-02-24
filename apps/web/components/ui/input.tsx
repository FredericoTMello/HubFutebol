import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-ink outline-none ring-0 placeholder:text-slate-400 focus:border-brand-500",
        className
      )}
      {...props}
    />
  );
}

