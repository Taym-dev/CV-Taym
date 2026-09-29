// Tekst waarvan elke letter omhoog springt bij hover.
// Elke letter heeft de class "pop-char", zodat GSAP ze kan animeren.
export function PopText({ text, className }: { text: string; className?: string }) {
  const words = text.split(" ")

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, wi) => (
          <span key={wi}>
            <span className="inline-block whitespace-nowrap">
              {[...word].map((char, ci) => (
                <span key={ci} className="pop-char inline-block">
                  <span className="inline-block transition-[translate,color,text-shadow] duration-150 ease-out hover:-translate-y-[0.1em] hover:text-main hover:[text-shadow:0.05em_0.05em_0_var(--border)]">
                    {char}
                  </span>
                </span>
              ))}
            </span>
            {wi < words.length - 1 && " "}
          </span>
        ))}
      </span>
    </span>
  )
}
