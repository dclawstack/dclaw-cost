import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default:     "bg-[#7030A0] text-white border-transparent",
    secondary:   "bg-[#f7f7f7] text-[#444444] border-transparent",
    destructive: "bg-red-100 text-red-700 border-transparent",
    outline:     "border border-[#7030A0] text-[#7030A0] bg-white",
  }
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
