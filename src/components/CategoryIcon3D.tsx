import { useId } from 'react';

/**
 * Consistent 3D-style SVG icon family for every category in the app.
 *
 * Each icon shares the same visual language — soft ground shadow, top-lit
 * glossy gradients, rounded friendly shapes, subtle highlights and rims — so
 * the whole set reads as one professional icon family rather than a random
 * collection of emoji. Pure inline SVG: offline-safe, no dependencies, crisp
 * at any size.
 */

interface IconProps {
  /** Tailwind size class, e.g. "h-9 w-9". */
  className?: string;
}

/** Soft elliptical ground shadow shared by every icon. */
const GroundShadow = ({ id }: { id: string }) => (
  <>
    <defs>
      <radialGradient id={`${id}-shadow`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#000" stopOpacity="0.35" />
        <stop offset="70%" stopColor="#000" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx="24" cy="43.5" rx="16" ry="4" fill={`url(#${id}-shadow)`} />
  </>
);

/** Glossy vertical gradient helper — top-lit plastic look. */
const Gloss = ({ id, from, to, mid }: { id: string; from: string; to: string; mid?: string }) => (
  <defs>
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={from} />
      {mid && <stop offset="55%" stopColor={mid} />}
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  </defs>
);

/** Specular highlight arc for a rounded body. */
const Highlight = ({ cx, cy, rx, ry, opacity = 0.5 }: { cx: number; cy: number; rx: number; ry: number; opacity?: number }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity={opacity} />
);

/* ============================== Icons ============================== */

const NewsIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-paper`} from="#ffffff" to="#dbe3ee" mid="#eef3fa" />
      {/* Newspaper body */}
      <rect x="9" y="9" width="30" height="29" rx="3" fill={`url(#${id}-paper)`} stroke="#94a3b8" strokeWidth="0.8" />
      {/* Masthead */}
      <rect x="12" y="12.5" width="24" height="4.5" rx="1" fill="#334155" />
      {/* Text lines */}
      <rect x="12" y="19.5" width="24" height="2.4" rx="1.2" fill="#94a3b8" />
      <rect x="12" y="23.5" width="16" height="2.4" rx="1.2" fill="#cbd5e1" />
      <rect x="12" y="27.5" width="24" height="2.4" rx="1.2" fill="#cbd5e1" />
      <rect x="12" y="31.5" width="20" height="2.4" rx="1.2" fill="#cbd5e1" />
      {/* Folded corner */}
      <path d="M39 29 L39 38 L30 38 Z" fill="#b6c2d3" />
      {/* Gloss */}
      <Highlight cx={16} cy={14.5} rx={7} ry={1.6} opacity={0.7} />
    </svg>
  );
};

const SportsIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-ball`} from="#ffffff" to="#dfe6ef" mid="#f2f6fb" />
      <Gloss id={`${id}-hoop`} from="#ff9d4d" to="#e2501f" mid="#ff7a33" />
      {/* Soccer ball */}
      <circle cx="18.5" cy="22" r="10.5" fill={`url(#${id}-ball)`} stroke="#94a3b8" strokeWidth="0.8" />
      <path d="M18.5 13.2 L22.6 16 L21.2 20.8 L15.8 20.8 L14.4 16 Z" fill="#1e293b" />
      <path d="M18.5 13.2 L18.5 16.5 L21.2 16 L22.6 16 Z" fill="#0f172a" />
      <path d="M14.4 16 L15.8 20.8 L11.8 23.5 L10 19.5 Z" fill="#1e293b" />
      <path d="M15.8 20.8 L21.2 20.8 L21.4 25.4 L16.6 25.8 Z" fill="#1e293b" />
      <path d="M21.2 20.8 L22.6 16 L27.5 18.5 L25.8 23.2 Z" fill="#1e293b" />
      <path d="M11.8 23.5 L15.8 20.8 L16.6 25.8 Z" fill="#0f172a" />
      <Highlight cx={15} cy={17} rx={4} ry={2.2} opacity={0.8} />
      {/* Basketball */}
      <circle cx="30.5" cy="30.5" r="8.5" fill={`url(#${id}-hoop)`} stroke="#c2410c" strokeWidth="0.8" />
      <path d="M23.5 25.5 Q30.5 30 37.5 25.5" fill="none" stroke="#7c2d12" strokeWidth="1.3" />
      <path d="M23.5 35.5 Q30.5 31 37.5 35.5" fill="none" stroke="#7c2d12" strokeWidth="1.3" />
      <path d="M27.5 23 Q29.5 30 27.5 37.5" fill="none" stroke="#7c2d12" strokeWidth="1.3" />
      <path d="M33.5 23 Q31.5 30 33.5 37.5" fill="none" stroke="#7c2d12" strokeWidth="1.3" />
      <Highlight cx={28} cy={27} rx={3.4} ry={1.8} opacity={0.55} />
    </svg>
  );
};

const MusicIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-a`} from="#ff8adf" to="#c026d3" mid="#f472d6" />
      <Gloss id={`${id}-b`} from="#a78bfa" to="#6d28d9" mid="#8b5cf6" />
      <Gloss id={`${id}-c`} from="#22d3ee" to="#0891b2" mid="#67e8f9" />
      {/* Note A */}
      <g>
        <path d="M17 15 L26 12.4 L26 24" fill="none" stroke={`url(#${id}-a)`} strokeWidth="3.4" strokeLinecap="round" />
        <ellipse cx="13.6" cy="25.5" rx="4.4" ry="3.4" fill={`url(#${id}-a)`} transform="rotate(-18 13.6 25.5)" />
        <ellipse cx="23" cy="25.5" rx="4.4" ry="3.4" fill={`url(#${id}-a)`} transform="rotate(-18 23 25.5)" />
        <Highlight cx={15} cy={15.5} rx={2.6} ry={1.1} opacity={0.8} />
      </g>
      {/* Note B */}
      <g>
        <path d="M29 26 L37 23.6 L37 34" fill="none" stroke={`url(#${id}-b)`} strokeWidth="3.2" strokeLinecap="round" />
        <ellipse cx="26.1" cy="35.4" rx="4.1" ry="3.1" fill={`url(#${id}-b)`} transform="rotate(-18 26.1 35.4)" />
        <ellipse cx="34.4" cy="35.4" rx="4.1" ry="3.1" fill={`url(#${id}-b)`} transform="rotate(-18 34.4 35.4)" />
        <Highlight cx={30} cy={26.5} rx={2.4} ry={1} opacity={0.8} />
      </g>
      {/* Sparkle note C */}
      <path d="M11 33.5 L12.3 30.9 L13.6 33.5 L16.2 34.8 L13.6 36.1 L12.3 38.7 L11 36.1 L8.4 34.8 Z" fill={`url(#${id}-c)`} />
      <Highlight cx={11.2} cy={32.6} rx={1.6} ry={0.8} opacity={0.9} />
    </svg>
  );
};

const KidsIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-fur`} from="#d9a15e" to="#92400e" mid="#c07a34" />
      <Gloss id={`${id}-muzzle`} from="#fce4b8" to="#e7b877" mid="#f8d9a0" />
      {/* Ears */}
      <circle cx="12.5" cy="14.5" r="5.5" fill={`url(#${id}-fur)`} />
      <circle cx="35.5" cy="14.5" r="5.5" fill={`url(#${id}-fur)`} />
      <circle cx="12.5" cy="14.5" r="2.6" fill="#f8d9a0" />
      <circle cx="35.5" cy="14.5" r="2.6" fill="#f8d9a0" />
      {/* Head */}
      <circle cx="24" cy="23" r="13.5" fill={`url(#${id}-fur)`} />
      {/* Muzzle */}
      <ellipse cx="24" cy="27.5" rx="7.5" ry="5.6" fill={`url(#${id}-muzzle)`} />
      {/* Eyes */}
      <circle cx="18.6" cy="20.5" r="1.9" fill="#1c1917" />
      <circle cx="29.4" cy="20.5" r="1.9" fill="#1c1917" />
      <circle cx="19.2" cy="19.8" r="0.7" fill="#fff" />
      <circle cx="30" cy="19.8" r="0.7" fill="#fff" />
      {/* Nose */}
      <ellipse cx="24" cy="25.6" rx="2.1" ry="1.6" fill="#451a03" />
      {/* Mouth */}
      <path d="M21 28.5 Q24 31 27 28.5" fill="none" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
      {/* Cheek blush */}
      <circle cx="15.5" cy="24.5" r="2.2" fill="#fb7185" opacity="0.35" />
      <circle cx="32.5" cy="24.5" r="2.2" fill="#fb7185" opacity="0.35" />
      {/* Gloss */}
      <Highlight cx={19} cy={15.5} rx={6} ry={3.2} opacity={0.35} />
    </svg>
  );
};

const EntertainmentIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-board`} from="#374151" to="#111827" mid="#273449" />
      <Gloss id={`${id}-gold`} from="#fde68a" to="#d97706" mid="#fbbf24" />
      {/* Clapperboard */}
      <path d="M10 17 L38 13 L38 21 L10 25 Z" fill={`url(#${id}-board)`} stroke="#0f172a" strokeWidth="0.6" />
      <rect x="10" y="21" width="28" height="16" rx="2" fill={`url(#${id}-board)`} stroke="#0f172a" strokeWidth="0.6" />
      {/* Slats */}
      <path d="M14 16.2 L20 15.2" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 14.8 L28 13.8" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M30 13.5 L35 13" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12.5 18.6 L17.5 17.8" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
      {/* Star */}
      <path
        d="M30.5 4.6 L32 7.6 L35.3 8 L32.9 10.3 L33.5 13.6 L30.5 12 L27.5 13.6 L28.1 10.3 L25.7 8 L29 7.6 Z"
        fill={`url(#${id}-gold)`}
        stroke="#92400e"
        strokeWidth="0.6"
      />
      <Highlight cx={29} cy={6.4} rx={2.4} ry={1.1} opacity={0.9} />
      <Highlight cx={16} cy={20} rx={6} ry={2} opacity={0.25} />
    </svg>
  );
};

const MoviesIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-reel`} from="#475569" to="#0f172a" mid="#334155" />
      <Gloss id={`${id}-pop`} from="#fef3c7" to="#f59e0b" mid="#fde68a" />
      {/* Film reel */}
      <circle cx="15.5" cy="29" r="11" fill={`url(#${id}-reel)`} stroke="#0f172a" strokeWidth="0.8" />
      <circle cx="15.5" cy="29" r="4.6" fill="#0f172a" />
      <circle cx="15.5" cy="29" r="2" fill="#64748b" />
      {/* Sprocket holes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <rect
          key={deg}
          x={deg >= 180 ? 13.2 : 13.2}
          y="19.6"
          width="1.8"
          height="3.4"
          rx="0.9"
          fill="#94a3b8"
          transform={`rotate(${deg} 15.5 29)`}
          transform-origin="15.5 29"
        />
      ))}
      {/* Popcorn box */}
      <path d="M30 32 L34.5 42 L27 42 L23 32 Z" fill="#e11d48" stroke="#9f1239" strokeWidth="0.6" />
      <path d="M30 32 L31.5 42" stroke="#9f1239" strokeWidth="0.6" />
      {/* Popcorn */}
      <circle cx="27" cy="29" r="3.2" fill={`url(#${id}-pop)`} stroke="#d97706" strokeWidth="0.6" />
      <circle cx="32.5" cy="28.2" r="3.6" fill={`url(#${id}-pop)`} stroke="#d97706" strokeWidth="0.6" />
      <circle cx="36.5" cy="30.5" r="3" fill={`url(#${id}-pop)`} stroke="#d97706" strokeWidth="0.6" />
      <circle cx="30.5" cy="26.6" r="3.1" fill={`url(#${id}-pop)`} stroke="#d97706" strokeWidth="0.6" />
      <Highlight cx={31} cy={26} rx={4.5} ry={1.4} opacity={0.7} />
      <Highlight cx={13} cy={25} rx={4} ry={1.8} opacity={0.3} />
    </svg>
  );
};

const DocumentaryIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-body`} from="#3f4c63" to="#111827" mid="#28344a" />
      <Gloss id={`${id}-lens`} from="#c7d5e8" to="#64748b" mid="#94a3b8" />
      {/* Camera body */}
      <rect x="9" y="19" width="24" height="15" rx="3.5" fill={`url(#${id}-body)`} stroke="#0b1220" strokeWidth="0.8" />
      {/* Viewfinder */}
      <rect x="14" y="14.5" width="9" height="5.5" rx="1.5" fill={`url(#${id}-body)`} stroke="#0b1220" strokeWidth="0.8" />
      {/* Lens */}
      <circle cx="21" cy="26.5" r="6.2" fill={`url(#${id}-lens)`} stroke="#0f172a" strokeWidth="0.8" />
      <circle cx="21" cy="26.5" r="3.6" fill="#334155" />
      <circle cx="21" cy="26.5" r="1.6" fill="#0f172a" />
      <Highlight cx={19} cy={23.8} rx={2.2} ry={1.2} opacity={0.9} />
      {/* Record dot */}
      <circle cx="30.5" cy="22" r="1.6" fill="#f43f5e" />
      {/* Handle */}
      <path d="M9 23 L5.5 23.5 L5.5 29.5 L9 30" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" />
      {/* Gloss */}
      <Highlight cx={13} cy={21.5} rx={5} ry={1.6} opacity={0.3} />
    </svg>
  );
};

const ReligiousIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-halo`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fcd34d" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-cross`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="22" r="17" fill={`url(#${id}-halo)`} />
      <ellipse cx="24" cy="42.5" rx="13" ry="3.2" fill="#000" opacity="0.2" />
      {/* Cross */}
      <rect x="21.2" y="9" width="5.6" height="27" rx="2.4" fill={`url(#${id}-cross)`} />
      <rect x="14.5" y="15.5" width="19" height="5.6" rx="2.4" fill={`url(#${id}-cross)`} />
      {/* Gloss */}
      <rect x="22" y="10.5" width="1.6" height="20" rx="0.8" fill="#fff" opacity="0.5" />
      <rect x="15.5" y="16.8" width="1.6" height="3.2" rx="0.8" fill="#fff" opacity="0.5" />
    </svg>
  );
};

const CarsIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-body`} from="#ff5b6e" to="#c81e3f" mid="#f43f5e" />
      <Gloss id={`${id}-glass`} from="#cffafe" to="#0e7490" mid="#67e8f9" />
      {/* Car body */}
      <path
        d="M9 30 L10.5 24.5 Q11 22.5 13 22 L18 19.5 Q21 18 24 18 L28 18 Q31 18 33 19.5 L37 22 Q39 22.5 39 24.5 L39.5 30 Z"
        fill={`url(#${id}-body)`}
        stroke="#881337"
        strokeWidth="0.8"
      />
      {/* Cabin */}
      <path d="M17.5 22 L19 18.5 Q21.5 16.8 24.5 17 L27.5 17.2 Q30 17.4 31.5 19 L33 22 Z" fill={`url(#${id}-glass)`} />
      <path d="M20 21.8 L21.5 18.4 M26.5 18.6 L28 21.9" stroke="#0e7490" strokeWidth="0.8" opacity="0.5" />
      {/* Wheels */}
      <circle cx="16.5" cy="30.5" r="4.4" fill="#0f172a" />
      <circle cx="16.5" cy="30.5" r="1.8" fill="#64748b" />
      <circle cx="33.5" cy="30.5" r="4.4" fill="#0f172a" />
      <circle cx="33.5" cy="30.5" r="1.8" fill="#64748b" />
      {/* Headlight */}
      <rect x="37" y="24" width="2.6" height="2.4" rx="1" fill="#fef08a" />
      <rect x="8.5" y="24" width="2.2" height="2.2" rx="1" fill="#fda4af" />
      {/* Gloss */}
      <Highlight cx={21} cy={20.5} rx={7} ry={1.8} opacity={0.5} />
    </svg>
  );
};

const TvShowsIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-frame`} from="#334155" to="#0f172a" mid="#1e293b" />
      <Gloss id={`${id}-screen`} from="#5eead4" to="#0f766e" mid="#2dd4bf" />
      <Gloss id={`${id}-play`} from="#ffffff" to="#cbd5e1" />
      {/* TV body */}
      <rect x="9" y="13" width="30" height="21" rx="3.5" fill={`url(#${id}-frame)`} stroke="#0b1220" strokeWidth="0.8" />
      {/* Screen */}
      <rect x="11.5" y="15.5" width="25" height="16" rx="2.2" fill={`url(#${id}-screen)`} />
      {/* Play button */}
      <path d="M21 19.5 L28 23.5 L21 27.5 Z" fill={`url(#${id}-play)`} />
      {/* Stand */}
      <path d="M24 34 L24 37.5 M17.5 37.5 L30.5 37.5" stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" />
      {/* Antenna */}
      <path d="M17 13 L13.5 8 M31 13 L34.5 8" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      {/* Gloss */}
      <Highlight cx={14.5} cy={17} rx={6} ry={2} opacity={0.35} />
    </svg>
  );
};

const RadioIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-body`} from="#f9a8d4" to="#be185d" mid="#ec4899" />
      <Gloss id={`${id}-speaker`} from="#831843" to="#4a044e" />
      {/* Radio body */}
      <rect x="10" y="15" width="28" height="22" rx="5" fill={`url(#${id}-body)`} stroke="#881337" strokeWidth="0.8" />
      {/* Speaker */}
      <circle cx="18.5" cy="28" r="7.5" fill={`url(#${id}-speaker)`} />
      <circle cx="18.5" cy="28" r="4.6" fill="none" stroke="#f9a8d4" strokeWidth="1.1" opacity="0.7" />
      <circle cx="18.5" cy="28" r="2.2" fill="none" stroke="#f9a8d4" strokeWidth="1.1" opacity="0.7" />
      {/* Dial + tuner */}
      <rect x="28.5" y="18.5" width="7" height="5" rx="1.6" fill="#fdf2f8" stroke="#9d174d" strokeWidth="0.6" />
      <circle cx="32" cy="30" r="3.4" fill="#fdf2f8" stroke="#9d174d" strokeWidth="0.8" />
      <rect x="31.1" y="27" width="1.8" height="6" rx="0.9" fill="#be185d" />
      {/* Antenna */}
      <path d="M14 15 L11 7.5" stroke="#9d174d" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="6.6" r="1.4" fill="#ec4899" />
      {/* Sound waves */}
      <path d="M34 7 Q37 10 34 13" fill="none" stroke="#f472b6" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M37.5 5 Q42 10 37.5 15" fill="none" stroke="#f472b6" strokeWidth="1.6" strokeLinecap="round" />
      {/* Gloss */}
      <Highlight cx={14.5} cy={18} rx={6} ry={1.8} opacity={0.4} />
    </svg>
  );
};

const TalkIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-mic`} from="#5eead4" to="#0f766e" mid="#2dd4bf" />
      <Gloss id={`${id}-grill`} from="#134e4a" to="#042f2e" />
      {/* Mic head */}
      <rect x="19.5" y="10" width="9" height="12" rx="4.5" fill={`url(#${id}-mic)`} stroke="#115e59" strokeWidth="0.8" />
      <rect x="21.5" y="12" width="5" height="8" rx="2.5" fill={`url(#${id}-grill)`} />
      {/* Neck */}
      <rect x="22.6" y="22" width="2.8" height="6" rx="1.2" fill="#134e4a" />
      {/* Base */}
      <path d="M15.5 32 L19 28 L29 28 L32.5 32 Q33 33 32 33.5 L16 33.5 Q15 33 15.5 32 Z" fill={`url(#${id}-mic)`} stroke="#115e59" strokeWidth="0.8" />
      {/* Stand */}
      <rect x="23" y="28" width="2" height="7" fill="#134e4a" />
      <ellipse cx="24" cy="35.5" rx="5" ry="1.8" fill="#115e59" />
      {/* Sound waves */}
      <path d="M12.5 14 Q10 18 12.5 22" fill="none" stroke="#5eead4" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9 11 Q5 18 9 25" fill="none" stroke="#5eead4" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M35.5 14 Q38 18 35.5 22" fill="none" stroke="#5eead4" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M39 11 Q43 18 39 25" fill="none" stroke="#5eead4" strokeWidth="1.7" strokeLinecap="round" />
      {/* Gloss */}
      <Highlight cx={21} cy={12.5} rx={3} ry={1.4} opacity={0.6} />
    </svg>
  );
};

const LiveIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-frame`} from="#4c1d95" to="#1e1b4b" mid="#312e81" />
      <Gloss id={`${id}-screen`} from="#c4b5fd" to="#6d28d9" mid="#8b5cf6" />
      <Gloss id={`${id}-badge`} from="#f87171" to="#dc2626" mid="#ef4444" />
      {/* Broadcast frame */}
      <rect x="8.5" y="12" width="31" height="22" rx="4" fill={`url(#${id}-frame)`} stroke="#1e1b4b" strokeWidth="0.8" />
      {/* Screen */}
      <rect x="11" y="14.5" width="26" height="17" rx="2.4" fill={`url(#${id}-screen)`} />
      {/* LIVE badge */}
      <rect x="17.5" y="20.5" width="13" height="5.4" rx="1.8" fill={`url(#${id}-badge)`} />
      <text x="24" y="24.4" textAnchor="middle" fontSize="4.4" fontWeight="800" fill="#fff" fontFamily="Inter, sans-serif">
        LIVE
      </text>
      {/* Stand */}
      <path d="M24 34 L24 37 M17 37 L31 37" stroke="#1e1b4b" strokeWidth="2.2" strokeLinecap="round" />
      {/* Gloss */}
      <Highlight cx={13.5} cy={16.5} rx={6} ry={2} opacity={0.35} />
    </svg>
  );
};

const InternationalIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-water`} from="#7dd3fc" to="#0369a1" mid="#38bdf8" />
      <Gloss id={`${id}-land`} from="#86efac" to="#15803d" mid="#4ade80" />
      {/* Globe */}
      <circle cx="22" cy="24" r="12.5" fill={`url(#${id}-water)`} stroke="#075985" strokeWidth="0.9" />
      {/* Continents */}
      <path d="M18.5 14.5 Q21 17 20 20 Q18.5 22 19.5 24.5 Q21 27 19 30 Q16 28.5 15.5 25.5 Q15 22 16.5 18.5 Z" fill={`url(#${id}-land)`} />
      <path d="M26 15 Q28.5 17.5 27.5 21 Q26.5 24 28 26.5 Q30 25 29.5 22.5 Q29 19.5 27 16.5 Z" fill={`url(#${id}-land)`} />
      {/* Meridians */}
      <ellipse cx="22" cy="24" rx="6.5" ry="12.5" fill="none" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.7" />
      <ellipse cx="22" cy="24" rx="12.5" ry="5" fill="none" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.7" />
      {/* Stand */}
      <path d="M22 36.5 L22 39 M17 39 L27 39" stroke="#075985" strokeWidth="2" strokeLinecap="round" />
      {/* Plane */}
      <g transform="rotate(-18 36 13)">
        <path d="M30.5 12.5 L40 9.5 L41 11 L33 13 L33 14.5 L36 15.5 L36 17 L31 15.5 L30.5 13.5 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.6" />
      </g>
      <Highlight cx={17} cy={17} rx={4.5} ry={2.4} opacity={0.6} />
    </svg>
  );
};

const GeneralIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-gold`} from="#fde68a" to="#d97706" mid="#fbbf24" />
      <Gloss id={`${id}-cyan`} from="#67e8f9" to="#0891b2" mid="#22d3ee" />
      {/* Main star */}
      <path
        d="M24 6 L27.2 15.4 L37 16.8 L29.7 23.4 L32.2 33 L24 27.8 L15.8 33 L18.3 23.4 L11 16.8 L20.8 15.4 Z"
        fill={`url(#${id}-gold)`}
        stroke="#92400e"
        strokeWidth="0.8"
      />
      {/* Small star */}
      <path
        d="M38 32 L39.2 34.7 L42 35.3 L39.8 37.4 L40.3 40.2 L38 38.8 L35.7 40.2 L36.2 37.4 L34 35.3 L36.8 34.7 Z"
        fill={`url(#${id}-cyan)`}
        stroke="#155e75"
        strokeWidth="0.6"
      />
      {/* Spark */}
      <path d="M10.5 10 L11.4 12.1 L13.5 13 L11.4 13.9 L10.5 16 L9.6 13.9 L7.5 13 L9.6 12.1 Z" fill={`url(#${id}-cyan)`} />
      <Highlight cx={20} cy={14} rx={4} ry={2} opacity={0.9} />
    </svg>
  );
};

const AllIcon = ({ className }: IconProps) => {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <GroundShadow id={id} />
      <Gloss id={`${id}-v1`} from="#a78bfa" to="#6d28d9" mid="#8b5cf6" />
      <Gloss id={`${id}-v2`} from="#38bdf8" to="#1d4ed8" mid="#3b82f6" />
      <Gloss id={`${id}-v3`} from="#34d399" to="#047857" mid="#10b981" />
      {/* Layered rounded tiles */}
      <rect x="6" y="14" width="15" height="15" rx="4" fill={`url(#${id}-v1)`} stroke="#4c1d95" strokeWidth="0.7" />
      <rect x="27" y="10" width="15" height="15" rx="4" fill={`url(#${id}-v2)`} stroke="#1e40af" strokeWidth="0.7" />
      <rect x="15" y="26" width="15" height="15" rx="4" fill={`url(#${id}-v3)`} stroke="#065f46" strokeWidth="0.7" />
      <Highlight cx={9.5} cy={16.5} rx={4} ry={1.5} opacity={0.5} />
      <Highlight cx={30} cy={12.5} rx={4} ry={1.5} opacity={0.5} />
      <Highlight cx={18} cy={28.5} rx={4} ry={1.5} opacity={0.5} />
    </svg>
  );
};

const CategoryIcon3D = ({ slug, className }: IconProps & { slug: string }) => {
  const key = slug?.toLowerCase().trim() ?? 'all';
  switch (key) {
    case 'news':
      return <NewsIcon className={className} />;
    case 'sports':
    case 'sport':
      return <SportsIcon className={className} />;
    case 'music':
      return <MusicIcon className={className} />;
    case 'kids':
      return <KidsIcon className={className} />;
    case 'entertainment':
    case 'enter':
    case 'entertain':
      return <EntertainmentIcon className={className} />;
    case 'movies':
    case 'movie':
      return <MoviesIcon className={className} />;
    case 'documentary':
    case 'docu':
      return <DocumentaryIcon className={className} />;
    case 'religious':
    case 'religion':
    case 'gospel':
      return <ReligiousIcon className={className} />;
    case 'cars':
    case 'car':
    case 'auto':
      return <CarsIcon className={className} />;
    case 'tvshows':
    case 'tv-show':
    case 'series':
      return <TvShowsIcon className={className} />;
    case 'radio':
    case 'radios':
      return <RadioIcon className={className} />;
    case 'talk':
      return <TalkIcon className={className} />;
    case 'live':
    case 'livetv':
    case 'live-tv':
      return <LiveIcon className={className} />;
    case 'international':
    case 'intl':
    case 'travel':
      return <InternationalIcon className={className} />;
    case 'general':
      return <GeneralIcon className={className} />;
    case 'all':
    default:
      return <AllIcon className={className} />;
  }
};

export default CategoryIcon3D;
