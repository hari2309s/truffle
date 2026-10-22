// Server-safe building blocks for the Privacy and Terms pages.

/** "Title: description" item, as used in the policy lists. */
export function LegalItem({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 border-t border-dashed border-truffle-border pt-2.5 first:border-t-0 first:pt-0">
      <span aria-hidden className="font-mono text-[13px] font-bold pt-[3px]">
        ·
      </span>
      <span>
        {title && <b className="font-mono text-[13px] tracking-[.02em]">{title} </b>}
        <span className="text-truffle-text2">{children}</span>
      </span>
    </li>
  )
}

export function LegalList({ children }: { children: React.ReactNode }) {
  return <ul className="m-0 p-0 list-none flex flex-col gap-2.5 text-base">{children}</ul>
}

export function MailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="text-truffle-accent-ink underline underline-offset-2">
      {email}
    </a>
  )
}

/** Rough read time in minutes for the meta line (200 wpm). */
export function readMinutes(...texts: unknown[]): number {
  const words = JSON.stringify(texts).split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}
