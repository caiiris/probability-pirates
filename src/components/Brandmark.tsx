import { ACCENT_ORDER, ACCENTS } from '@/lib/theme';

/**
 * Pascal's Triangle, the app's signature motif: the structure that generates
 * the binomial coefficients at the heart of probability, named after Blaise
 * Pascal. Four rows of dots (1, 2, 3, 4), one accent per row.
 */
export function Brandmark({
  size = 28,
  monochrome = false,
  className,
}: {
  size?: number;
  monochrome?: boolean;
  className?: string;
}) {
  const rows = 4;
  const stepX = 11;
  const stepY = 11;
  const apexX = 24;
  const apexY = 6;
  const r = 3.4;

  const dots: { x: number; y: number; color: string }[] = [];
  for (let row = 0; row < rows; row++) {
    const color = monochrome
      ? 'currentColor'
      : ACCENTS[ACCENT_ORDER[row % ACCENT_ORDER.length]].base;
    const y = apexY + row * stepY;
    for (let i = 0; i <= row; i++) {
      const x = apexX + (i - row / 2) * stepX;
      dots.push({ x, y, color });
    }
  }

  return (
    <svg
      viewBox="0 0 48 44"
      width={size}
      height={(size * 44) / 48}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Probability Pirates"
      className={className}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={r} fill={d.color} />
      ))}
    </svg>
  );
}

/** Brandmark + wordmark lockup. Use in app chrome (nav, headers). */
export function Wordmark({ className, markSize = 26 }: { className?: string; markSize?: number }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <Brandmark size={markSize} />
      <span className="font-display text-lg font-bold tracking-tight text-foreground whitespace-nowrap">
        Probability Pirates
      </span>
    </span>
  );
}
