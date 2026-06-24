/** 3D-style die illustration. Renders a cube with a visible top and right face. */
export function Die({ value, className }: { value?: number; className?: string }) {
  const face = value ?? 1;
  const dots = getDots(face);

  // Geometry: front face (0,8)→(48,56), top face parallelogram, right face parallelogram
  // Depth offset is 8px to top-left giving an isometric cube feel

  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={value ? `Die showing ${value}` : 'Die'}
      role="img"
    >
      {/* Shadow */}
      <ellipse cx="31" cy="55" rx="18" ry="2.5" fill="rgba(0,0,0,0.12)" />

      {/* Right face (dark) */}
      <path
        d="M44 10 L52 4 L52 48 L44 54 Z"
        fill="#b8b0a4"
        stroke="#a09890"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* Top face (medium) */}
      <path
        d="M4 10 L44 10 L52 4 L12 4 Z"
        fill="#d8d0ca"
        stroke="#c0b8b0"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />

      {/* Front face (light ivory — classic die look) */}
      <rect
        x="4"
        y="10"
        width="40"
        height="44"
        rx="7"
        fill="#faf8f5"
        stroke="#c8c0b8"
        strokeWidth="1"
      />

      {/* Dots on front face — offset to centre of front face (4,10)→(44,54) */}
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3.6" fill="#1c1512" />
      ))}
    </svg>
  );
}

/**
 * Dot positions within the front face bounding box (4,10)→(44,54).
 * Centre of face: (24, 32). Spread radius ~11.
 */
function getDots(value: number): [number, number][] {
  const L = 14; // left column x
  const M = 24; // middle column x
  const R = 34; // right column x
  const T = 21; // top row y
  const C = 32; // centre row y
  const B = 43; // bottom row y

  switch (value) {
    case 1:
      return [[M, C]];
    case 2:
      return [[L, T], [R, B]];
    case 3:
      return [[L, T], [M, C], [R, B]];
    case 4:
      return [[L, T], [R, T], [L, B], [R, B]];
    case 5:
      return [[L, T], [R, T], [M, C], [L, B], [R, B]];
    case 6:
      return [[L, T], [R, T], [L, C], [R, C], [L, B], [R, B]];
    default:
      return [[M, C]];
  }
}
