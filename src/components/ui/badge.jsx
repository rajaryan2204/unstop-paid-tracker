import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-slate-900 text-white shadow-xs hover:bg-slate-800",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-800 font-semibold",
        outline: "text-slate-800 border-slate-200",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 font-semibold",
        info:
          "border-sky-200 bg-sky-50 text-sky-800 font-semibold",
        purple:
          "border-purple-200 bg-purple-50 text-purple-800 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
