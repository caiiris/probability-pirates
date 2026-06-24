/** Geometric trophy SVG — flat, minimal, no stock art. */
export function Trophy({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Cup body */}
      <path
        d="M14 6h20v16c0 5.523-4.477 10-10 10s-10-4.477-10-10V6z"
        fill="currentColor"
        opacity="0.15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Handles */}
      <path
        d="M14 10H8a4 4 0 0 0 4 4h2M34 10h6a4 4 0 0 1-4 4h-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Stem */}
      <path d="M24 32v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Base */}
      <path d="M16 38h16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Star accent */}
      <path d="M24 12l1.5 3h3l-2.5 2 1 3-3-2-3 2 1-3-2.5-2h3z" fill="currentColor" />
    </svg>
  );
}
