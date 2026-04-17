"use client"

import { Palette } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Props {
  size?: "sm" | "md" | "lg"
}

export function DesignerBadge({ size = "md" }: Props) {
  const iconClass =
    size === "sm"
      ? "h-3.5 w-3.5"
      : size === "lg"
      ? "h-6 w-6"
      : "h-5 w-5"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center justify-center"
            aria-label="Recognized Designer"
          >
            <Palette
              className={`${iconClass} drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]`}
              style={{
                stroke: "url(#designer-gradient)",
                filter: "drop-shadow(0 0 3px rgba(168,85,247,0.6))",
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="designer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-semibold">Recognized Designer</p>
          <p className="text-xs text-muted-foreground">Housing designer</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
