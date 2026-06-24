/**
 * Game-show door illustration for the Monty Hall lesson. Three states:
 * `closed` (a panel with a handle and optional number), `goat`, and `car`
 * (the door stands open and the prize shows). Palette matches the Die so the
 * illustration set reads as one family.
 */

type DoorState = 'closed' | 'goat' | 'car';

export function Door({
  state,
  label,
  className,
}: {
  state: DoorState;
  label?: string;
  className?: string;
}) {
  const ariaLabel =
    state === 'car'
      ? 'Open door with the car'
      : state === 'goat'
        ? 'Open door with a goat'
        : `Closed door${label ? ` ${label}` : ''}`;

  return (
    <svg
      viewBox="0 0 60 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Frame */}
      <rect x="2" y="2" width="56" height="92" rx="4" fill="#d8d0ca" stroke="#b8b0a4" strokeWidth="2" />

      {state === 'closed' ? (
        <>
          {/* Door panel */}
          <rect x="7" y="7" width="46" height="82" rx="3" fill="#faf8f5" stroke="#c8c0b8" strokeWidth="1.5" />
          <rect x="13" y="14" width="34" height="30" rx="2" fill="none" stroke="#cfc7bf" strokeWidth="1.5" />
          <rect x="13" y="50" width="34" height="32" rx="2" fill="none" stroke="#cfc7bf" strokeWidth="1.5" />
          {/* Handle */}
          <circle cx="44" cy="48" r="2.4" fill="#9a9088" />
          {label && (
            <text x="30" y="11.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b6258" fontFamily="system-ui, sans-serif">
              {label}
            </text>
          )}
        </>
      ) : (
        <>
          {/* Open doorway */}
          <rect x="7" y="7" width="46" height="82" rx="3" fill="#1c1512" />
          {state === 'car' ? <Car /> : <Goat />}
        </>
      )}
    </svg>
  );
}

function Car() {
  // Simple side-on car in the brand violet so the prize reads as the win.
  return (
    <g transform="translate(11 38)">
      <path d="M2 14 L7 5 L27 5 L34 14 Z" fill="#6B4EFF" />
      <rect x="0" y="14" width="38" height="9" rx="2" fill="#6B4EFF" />
      <rect x="10" y="7" width="9" height="6" rx="1" fill="#D9D2FF" />
      <rect x="21" y="7" width="8" height="6" rx="1" fill="#D9D2FF" />
      <circle cx="9" cy="24" r="4" fill="#211C30" />
      <circle cx="30" cy="24" r="4" fill="#211C30" />
    </g>
  );
}

function Goat() {
  // Minimal goat: body, head, horn, legs.
  return (
    <g transform="translate(13 40)" stroke="#e7e2da" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="16" cy="14" rx="13" ry="8" fill="#cfc7bf" />
      <path d="M27 9 L34 4 L33 13 Z" fill="#cfc7bf" />
      <path d="M33 6 Q37 2 36 -2" fill="none" />
      <path d="M8 22 L8 28 M14 22 L14 28 M19 22 L19 28 M24 22 L24 28" />
      <circle cx="32" cy="8" r="1" fill="#1c1512" stroke="none" />
    </g>
  );
}
