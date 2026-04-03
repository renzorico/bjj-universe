import { PropsWithChildren } from 'react';

type SurfaceCardProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  description?: string;
  className?: string;
}>;

export function SurfaceCard({
  title,
  eyebrow,
  description,
  className = '',
  children,
}: SurfaceCardProps) {
  return (
    <section
      className={`rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl ${className}`}
    >
      <header className="mb-5">
        {eyebrow ? (
          <p className="mb-2 text-xs tracking-[0.28em] text-[var(--accent-soft)] uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-2xl text-white">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
