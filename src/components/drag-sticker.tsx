import { useRef, useState, type PointerEvent, type ReactNode } from "react"

import { cn } from "@/lib/utils"

// Sticker die je met muis of vinger kunt verslepen.
export function DragSticker({
  children,
  rotate = 0,
  className,
}: {
  children: ReactNode
  rotate?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const offset = useRef({ x: 0, y: 0 })
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  function onPointerDown(e: PointerEvent<HTMLSpanElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { px: e.clientX, py: e.clientY, ...offset.current }
    setDragging(true)
  }

  function onPointerMove(e: PointerEvent<HTMLSpanElement>) {
    if (!start.current || !ref.current) return
    offset.current = {
      x: start.current.x + e.clientX - start.current.px,
      y: start.current.y + e.clientY - start.current.py,
    }
    ref.current.style.translate = `${offset.current.x}px ${offset.current.y}px`
  }

  function onPointerUp() {
    start.current = null
    setDragging(false)
  }

  return (
    <span
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ rotate: `${dragging ? rotate - 4 : rotate}deg` }}
      className={cn(
        "absolute z-10 cursor-grab touch-none rounded-base border-2 border-border px-3 py-1.5 font-mono text-xs font-bold uppercase shadow-shadow select-none transition-[rotate,scale,box-shadow] duration-150",
        dragging && "z-20 scale-110 cursor-grabbing shadow-[8px_8px_0_0_var(--border)]",
        className,
      )}
    >
      {children}
    </span>
  )
}
