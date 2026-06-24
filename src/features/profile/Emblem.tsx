export type EmblemName =
  | 'gem'
  | 'rebound'
  | 'sunrise'
  | 'bolt'
  | 'star'
  | 'cap'
  | 'crown'
  | 'link'
  | 'heart'
  | 'flame';

/** Unique emblem mark for each trophy, drawn in `currentColor`. */
const EMBLEMS: Record<EmblemName, React.ReactNode> = {
  gem: (
    <g>
      <path d="M6 4h12l3 5-9 12L3 9z" fill="currentColor" />
      <path
        d="M3 9h18M9 4 7 9l5 12 5-12-2-5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        opacity="0.5"
      />
    </g>
  ),
  rebound: (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 13a7 7 0 1 1 7 7" />
      <path d="M12 21l-4-3 4-3" />
    </g>
  ),
  sunrise: (
    <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M3 19h18" />
      <path d="M7 19a5 5 0 0 1 10 0" fill="currentColor" stroke="none" />
      <path d="M12 4v2M5 8l1.5 1.5M19 8l-1.5 1.5" />
    </g>
  ),
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="currentColor" />,
  star: (
    <path
      d="M12 3l2.6 5.3 5.9.8-4.3 4.1 1 5.8L12 18.8 6.8 19l1-5.8-4.3-4.1 5.9-.8z"
      fill="currentColor"
    />
  ),
  cap: (
    <g>
      <path d="M12 4 2 9l10 5 10-5z" fill="currentColor" />
      <path
        d="M6 12v4c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4v-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M22 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  crown: (
    <path d="M4 8l3.2 3.2L12 5l4.8 6.2L20 8v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" fill="currentColor" />
  ),
  link: (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="8.5" cy="12" r="4.5" />
      <circle cx="15.5" cy="12" r="4.5" />
    </g>
  ),
  heart: (
    <path
      d="M12 21S3.5 14.5 3.5 8.8A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.5 2.6C20.5 14.5 12 21 12 21z"
      fill="currentColor"
    />
  ),
  flame: (
    <path
      d="M13 2c.5 4 4 5.5 4 9.5A5 5 0 0 1 7 12c0-2 .8-3.2 1.8-4.2.2 1.6 1 2.4 1.8 2.6C10.4 7 9.8 4.6 13 2z"
      fill="currentColor"
    />
  ),
};

export function Emblem({ name, className }: { name: EmblemName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      {EMBLEMS[name]}
    </svg>
  );
}
