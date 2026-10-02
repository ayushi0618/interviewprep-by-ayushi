// Logo — InterviewPrep's ONE brand mark, used in the navbar, the footer
// author card, and (as a static copy) the favicon.
//
// Design: a GFG-green rounded tile holding an open book; the code
// brackets </> sit on the pages — "notes + code" in a single glyph.
// It carries its own background, so it reads on light AND dark
// surfaces and stays legible down to favicon size (32px).
export default function Logo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="InterviewPrep logo"
    >
      <defs>
        <linearGradient id="ip-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3aa655" />
          <stop offset="100%" stopColor="#308d46" />
        </linearGradient>
      </defs>
      {/* tile */}
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#ip-logo-grad)" />
      {/* open book */}
      <path
        d="M32 17 C26.5 12.5 18.5 11 11 13 L11 45 C18.5 43 26.5 44 32 48.5 C37.5 44 45.5 43 53 45 L53 13 C45.5 11 37.5 12.5 32 17 Z"
        fill="#ffffff"
      />
      {/* spine */}
      <line x1="32" y1="17" x2="32" y2="48.5" stroke="#d7eedd" strokeWidth="2" />
      {/* </> brackets on the pages */}
      <g stroke="#308d46" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="27,25 21,31.5 27,38" />
        <line x1="36.5" y1="24" x2="29.5" y2="40" />
        <polyline points="37,25 43,31.5 37,38" />
      </g>
    </svg>
  );
}
