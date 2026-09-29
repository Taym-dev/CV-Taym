import { useEffect, useState } from "react"

// Wisselt elke paar seconden van zin, met een korte flip.
export function RotatingText({ items, interval = 2600 }: { items: string[]; interval?: number }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), interval)
    return () => clearInterval(timer)
  }, [items.length, interval])

  return (
    <>
      <span className="sr-only">{items[0]}</span>
      <span aria-hidden="true" className="inline-block [perspective:400px]">
        <span key={index} className="inline-block animate-flip-in">
          {items[index]}
        </span>
      </span>
    </>
  )
}
