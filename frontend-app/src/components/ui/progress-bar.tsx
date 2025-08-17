// src/components/ui/progress-bar.tsx
import * as React from "react"
import { cn } from "../../lib/utils"

type ProgressBarProps = {
  value: number
  max: number
  className?: string
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const percent = Math.round((value / max) * 100)

  return (
    <div
      className={cn(
        "w-full h-3 bg-gray-100 rounded-full overflow-hidden",
        className
      )}
    >
      <div
        className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}