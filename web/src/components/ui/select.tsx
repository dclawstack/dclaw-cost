import * as React from "react"
import { cn } from "@/lib/utils"

// Native <select> wrapper — keeps the simpler API used across all app pages.
// For a custom dropdown matching the finance app, use the dclaw-finance select.tsx.
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-[#ededed] bg-white px-3 py-2 text-sm text-[#444444] focus:outline-none focus:ring-2 focus:ring-[#7030A0] focus:border-[#7030A0] disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
})
Select.displayName = "Select"

export { Select }
