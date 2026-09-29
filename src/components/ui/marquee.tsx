import { cn } from "@/lib/utils"

type Props = {
  items: string[]
  className?: string
  itemClassName?: string
  separator?: string
}

export default function Marquee({ items, className, itemClassName, separator }: Props) {
  const renderItems = () =>
    items.map((item) => (
      <span key={item} className={cn("mx-4 text-4xl", itemClassName)}>
        {item}
        {separator && <span className="ml-8" aria-hidden="true">{separator}</span>}
      </span>
    ))

  return (
    <div
      className={cn(
        "relative flex w-full overflow-x-hidden border-b-2 border-t-2 border-border bg-secondary-background text-foreground font-base",
        className,
      )}
    >
      <div className="animate-marquee whitespace-nowrap py-12">{renderItems()}</div>

      <div className="absolute top-0 animate-marquee2 whitespace-nowrap py-12" aria-hidden="true">
        {renderItems()}
      </div>

      {/* must have both of these in order to work */}
    </div>
  )
}
