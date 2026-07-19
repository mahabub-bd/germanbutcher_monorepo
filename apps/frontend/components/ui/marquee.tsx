import { cn } from "@/lib/utils"

interface MarqueeProps {
  className?: string
  reverse?: boolean
  pauseOnHover?: boolean
  children?: React.ReactNode
  repeat?: number
  [key: string]: unknown
}

export function Marquee({ className, reverse, pauseOnHover = false, children, repeat = 4, ...props }: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn("group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]", className)}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row",
              reverse && "animate-marquee-reverse",
              pauseOnHover && "group-hover:[animation-play-state:paused]",
            )}
          >
            {children}
          </div>
        ))}
    </div>
  )
}