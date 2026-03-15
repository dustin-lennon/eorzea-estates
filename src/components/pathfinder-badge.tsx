import { Compass } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Props {
  size?: "sm" | "md"
}

export function PathfinderBadge({ size = "md" }: Props) {
  const iconClass =
    size === "sm"
      ? "h-3.5 w-3.5"
      : "h-5 w-5"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex items-center justify-center"
            aria-label="Pathfinder — Beta Tester"
          >
            <Compass
              className={`${iconClass} drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]`}
              style={{
                stroke: "url(#pathfinder-gradient)",
                filter: "drop-shadow(0 0 3px rgba(251,191,36,0.6))",
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="pathfinder-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>
            </svg>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-semibold">Pathfinder</p>
          <p className="text-xs text-muted-foreground">Beta Tester</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
