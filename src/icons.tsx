import type { ComponentChildren } from 'preact';
import type { IconKey } from './types';

/*
 * Drink illustrations. 64×64, one ink weight, flat fills, tiny faces.
 * Drawn by hand as paths so they stay crisp at any size.
 */

const INK = '#3B2E28';
const line = {
  stroke: INK,
  'stroke-width': 2.4,
  'stroke-linejoin': 'round',
  'stroke-linecap': 'round',
} as const;

function Face({ x, y, s = 1, sleepy = false }: { x: number; y: number; s?: number; sleepy?: boolean }) {
  const e = 4.6 * s;
  return (
    <g>
      <ellipse cx={x - e - 3.6 * s} cy={y + 2.6 * s} rx={2.3 * s} ry={1.3 * s} fill="#F08C83" opacity=".55" />
      <ellipse cx={x + e + 3.6 * s} cy={y + 2.6 * s} rx={2.3 * s} ry={1.3 * s} fill="#F08C83" opacity=".55" />
      {sleepy ? (
        <>
          <path d={`M${x - e - 1.6 * s} ${y} q${1.6 * s} ${1.2 * s} ${3.2 * s} 0`} fill="none" {...line} stroke-width={1.8 * s} />
          <path d={`M${x + e - 1.6 * s} ${y} q${1.6 * s} ${1.2 * s} ${3.2 * s} 0`} fill="none" {...line} stroke-width={1.8 * s} />
        </>
      ) : (
        <>
          <circle cx={x - e} cy={y} r={1.55 * s} fill={INK} />
          <circle cx={x + e} cy={y} r={1.55 * s} fill={INK} />
        </>
      )}
      <path
        d={`M${x - 2.2 * s} ${y + 2.6 * s} q${2.2 * s} ${2 * s} ${4.4 * s} 0`}
        fill="none"
        {...line}
        stroke-width={1.8 * s}
      />
    </g>
  );
}

const Bubble = ({ x, y, r = 1.3 }: { x: number; y: number; r?: number }) => (
  <circle cx={x} cy={y} r={r} fill="#fff" opacity=".85" />
);

const Ice = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <rect
    x={x}
    y={y}
    width="11"
    height="11"
    rx="2.5"
    fill="#fff"
    fill-opacity=".75"
    stroke={INK}
    stroke-width="1.6"
    stroke-opacity=".35"
    transform={`rotate(${r} ${x + 5.5} ${y + 5.5})`}
  />
);

/** Short wide tumbler shared by shochu / whisky / umeshu. */
function Rocks({ liquid, top, children }: { liquid: string; top: number; children?: ComponentChildren }) {
  // Walls run from (12,22)→(15,57) and (52,22)→(49,57)
  const at = (y: number) => 12 + ((y - 22) * 3) / 35;
  const l = at(top);
  return (
    <>
      <path d="M12 22h40l-3 32a4 4 0 0 1-4 3.6H19a4 4 0 0 1-4-3.6z" fill="#EEF5F5" />
      <path d={`M${l} ${top}H${64 - l}L49 54a4 4 0 0 1-4 3.6H19a4 4 0 0 1-4-3.6z`} fill={liquid} />
      {children}
      <path d="M12 22h40l-3 32a4 4 0 0 1-4 3.6H19a4 4 0 0 1-4-3.6z" fill="none" {...line} />
      <path d="M17 27v8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9" />
    </>
  );
}

const ART: Record<IconKey, () => preact.JSX.Element> = {
  jug: () => (
    <>
      <path d="M44 27h4.5a6 6 0 0 1 6 6v9a6 6 0 0 1-6 6H44" fill="none" {...line} stroke-width="3.2" />
      <rect x="12" y="20" width="33" height="37" rx="5" fill="#F7C548" {...line} />
      <path d="M18 30v18" stroke="#FCE3A0" stroke-width="3" stroke-linecap="round" />
      <path
        d="M10.5 23.5c-1.6-4.8 2.4-9.3 7-8 1.7-4.6 9-6 12-1.5 3-3.6 10.6-2.6 11.2 3 4.4.4 5.6 6.5 1.6 8.1-1 .4-30.6.9-31.8-1.6z"
        fill="#FFFDF7"
        {...line}
      />
      <Bubble x={36} y={46} />
      <Bubble x={39} y={40} r={1} />
      <Face x={28.5} y={38} />
    </>
  ),
  can: () => (
    <>
      <rect x="17" y="10" width="30" height="47" rx="5" fill="#8EC3E6" {...line} />
      <path d="M17 18h30M17 49h30" fill="none" {...line} />
      <rect x="24" y="25" width="16" height="7" rx="3.5" fill="#F7C548" opacity=".9" />
      <path d="M27 6.5h10" fill="none" {...line} stroke-width="3" />
      <Face x={32} y={39} />
    </>
  ),
  canLemon: () => (
    <>
      <rect x="17" y="10" width="30" height="47" rx="5" fill="#F3DE62" {...line} />
      <path d="M17 18h30M17 49h30" fill="none" {...line} />
      <circle cx="41" cy="26" r="5.2" fill="#FFF7C2" {...line} stroke-width="1.8" />
      <path d="M41 21.6v8.8M36.6 26h8.8" stroke={INK} stroke-width="1.2" opacity=".5" />
      <path d="M27 6.5h10" fill="none" {...line} stroke-width="3" />
      <Face x={30} y={39} />
    </>
  ),
  bottle: () => (
    <>
      <path
        d="M27 6h10v11c0 4 8 6.5 8 14v22a4 4 0 0 1-4 4H23a4 4 0 0 1-4-4V31c0-7.5 8-10 8-14z"
        fill="#86B98A"
        {...line}
      />
      <path d="M26 6h12" fill="none" {...line} stroke-width="3.4" />
      <rect x="19" y="33" width="26" height="15" fill="#FFF7E8" {...line} stroke-width="2" />
      <Face x={32} y={39.5} s={0.85} />
    </>
  ),
  highball: () => (
    <>
      <path d="M17 9h30l-3 46a3.5 3.5 0 0 1-3.5 3.3h-17A3.5 3.5 0 0 1 20 55z" fill="#EEF5F5" />
      <path d="M17.8 21h28.4l-2.2 34a3.5 3.5 0 0 1-3.5 3.3h-17A3.5 3.5 0 0 1 20 55z" fill="#F4D27C" />
      <Ice x={21} y={14} r={-12} />
      <Ice x={31} y={18} r={14} />
      <Bubble x={38} y={50} />
      <Bubble x={41} y={43} r={1} />
      <Bubble x={24} y={52} r={1} />
      <path d="M17 9h30l-3 46a3.5 3.5 0 0 1-3.5 3.3h-17A3.5 3.5 0 0 1 20 55z" fill="none" {...line} />
      <path d="M38 4l-3 18" stroke="#E07B5F" stroke-width="2.6" stroke-linecap="round" />
      <Face x={32} y={40} />
    </>
  ),
  sour: () => (
    <>
      <path d="M44 28h4a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6h-4" fill="none" {...line} stroke-width="3.2" />
      <path d="M12 18h33v35a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="#EEF5F5" />
      <path d="M12 25h33v28a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="#F6EDAA" />
      <Ice x={15} y={21} r={-10} />
      <Bubble x={36} y={50} />
      <Bubble x={39} y={44} r={1} />
      <path d="M12 18h33v35a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="none" {...line} />
      <circle cx="42" cy="17" r="8" fill="#F3DE62" {...line} />
      <circle cx="42" cy="17" r="5" fill="#FFF7C2" />
      <path d="M42 12v10M37 17h10M38.5 13.5l7 7M45.5 13.5l-7 7" stroke="#E2C640" stroke-width="1.2" />
      <Face x={28} y={40} />
    </>
  ),
  wine: () => (
    <>
      <path d="M17 8h30c0 15-4 26-15 26S17 23 17 8z" fill="#F6EEF0" />
      <path d="M17.7 18h28.6c-1.3 10-5.5 16-14.3 16s-13-6-14.3-16z" fill="#C8566A" />
      <path d="M17 8h30c0 15-4 26-15 26S17 23 17 8z" fill="none" {...line} />
      <path d="M32 34v18M22 56.5c0-2.8 4.6-4.5 10-4.5s10 1.7 10 4.5z" fill="#F6EEF0" {...line} />
      <path d="M21.5 12v5" stroke="#fff" stroke-width="2.4" stroke-linecap="round" />
      <Face x={32} y={24} s={0.85} />
    </>
  ),
  sparkling: () => (
    <>
      <path d="M24 5h16l-1.4 25c-.3 5-3 9-6.6 9s-6.3-4-6.6-9z" fill="#F4F2EA" />
      <path d="M24.6 13h14.8l-.8 17c-.3 5-3 9-6.6 9s-6.3-4-6.6-9z" fill="#F2D987" />
      <Bubble x={29} y={32} r={1} />
      <Bubble x={35} y={27} r={1.1} />
      <Bubble x={31} y={18} r={0.9} />
      <path d="M24 5h16l-1.4 25c-.3 5-3 9-6.6 9s-6.3-4-6.6-9z" fill="none" {...line} />
      <path d="M32 39v14M23 57.5c0-2.6 4-4.2 9-4.2s9 1.6 9 4.2z" fill="#F4F2EA" {...line} />
      <path d="M46 10l2-2M48 16h3M45 4.5l.5-2" stroke={INK} stroke-width="2" stroke-linecap="round" />
      <Face x={32} y={25} s={0.62} />
    </>
  ),
  sake: () => (
    <>
      <path
        d="M21 7h9v5c0 4 10.5 8.5 10.5 23 0 13-5 21.5-15 21.5S10.5 48 10.5 35c0-14.5 10.5-19 10.5-23z"
        fill="#F5F1E8"
        {...line}
      />
      <path d="M12.7 26.5c8.6 2.2 17 2.2 25.6 0" fill="none" stroke="#5B7DB5" stroke-width="3" stroke-linecap="round" />
      <path d="M20 7h11" fill="none" {...line} stroke-width="3.2" />
      <Face x={25.5} y={41} s={0.9} />
      <path d="M41 44h17l-2.2 9.6a3 3 0 0 1-3 2.4h-6.6a3 3 0 0 1-3-2.4z" fill="#F5F1E8" {...line} />
      <path d="M43.5 47.5h12" stroke="#5B7DB5" stroke-width="2" stroke-linecap="round" />
    </>
  ),
  shochu: () => (
    <Rocks liquid="#DCEBEC" top={32}>
      <Ice x={19} y={30} r={-14} />
      <Ice x={33} y={29} r={10} />
      <Face x={32} y={46} />
    </Rocks>
  ),
  whisky: () => (
    <Rocks liquid="#DC9A47" top={34}>
      <Ice x={26} y={27} r={-8} />
      <Face x={32} y={46} />
    </Rocks>
  ),
  umeshu: () => (
    <Rocks liquid="#E9B562" top={33}>
      <Ice x={17} y={29} r={-12} />
      <circle cx="40" cy="42" r="6" fill="#B8C55B" stroke={INK} stroke-width="1.6" stroke-opacity=".5" />
      <path d="M40 36.5c1-1.5 2.5-2 4-2" fill="none" stroke="#7E8F3A" stroke-width="1.6" stroke-linecap="round" />
      <Face x={27} y={46} s={0.9} />
    </Rocks>
  ),
  cocktail: () => (
    <>
      <path d="M11 11h42L32 35z" fill="#F7EEF2" />
      <path d="M14.5 15h35L32 35z" fill="#F2A1B8" />
      <path d="M11 11h42L32 35z" fill="none" {...line} />
      <path d="M32 35v16M22 56c0-2.8 4.4-4.5 10-4.5s10 1.7 10 4.5z" fill="#F7EEF2" {...line} />
      <path d="M44 4l-6 16" stroke={INK} stroke-width="1.8" stroke-linecap="round" />
      <circle cx="44.5" cy="8" r="4.6" fill="#D9485E" {...line} stroke-width="2" />
      <Face x={30} y={20} s={0.72} />
    </>
  ),
};

export function DrinkIcon({ icon, size = 48 }: { icon: IconKey; size?: number }) {
  const Art = ART[icon] ?? ART.bottle;
  return (
    <svg class="drink-icon" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <Art />
    </svg>
  );
}

/** Background tint for the plate behind each icon. */
export const TINT: Record<IconKey, string> = {
  jug: '#FBEBC4',
  can: '#DCEBF5',
  canLemon: '#F8F0C4',
  bottle: '#DDEBDC',
  highball: '#F8EBCB',
  sour: '#F6F2CF',
  wine: '#F5DDE2',
  sparkling: '#F6EED3',
  sake: '#E2E8F3',
  shochu: '#E2EEEE',
  whisky: '#F4E0C8',
  umeshu: '#EEF0D2',
  cocktail: '#F8DFE6',
};

/* ---------- mood faces ---------- */

export function MoodFace({ level, size = 28 }: { level: number; size?: number }) {
  const fills = ['#F2EBDD', '#F9DDC2', '#F7C7A8', '#F2A58E', '#E9897D'];
  const mouth = [
    'M12.5 19.5h7',
    'M12 19q4 2.6 8 0',
    'M11.5 18.5q4.5 4.2 9 0',
    'M12 20q2-2 4 0t4 0',
    'M13 20.5q3-3 6 0',
  ][level];
  const eyes =
    level <= 1 ? (
      <>
        <circle cx="11.5" cy="14" r="1.5" fill={INK} />
        <circle cx="20.5" cy="14" r="1.5" fill={INK} />
      </>
    ) : level === 2 ? (
      <>
        <path d="M9.6 14.6q1.9-2 3.8 0M18.6 14.6q1.9-2 3.8 0" fill="none" {...line} stroke-width="1.6" />
      </>
    ) : level === 3 ? (
      <>
        <path d="M9.8 13.2q1.7 1.6 3.4 0M18.8 13.2q1.7 1.6 3.4 0" fill="none" {...line} stroke-width="1.6" />
      </>
    ) : (
      <>
        <path d="M10 12.5l3 3M13 12.5l-3 3M19 12.5l3 3M22 12.5l-3 3" fill="none" {...line} stroke-width="1.5" />
      </>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13" fill={fills[level]} {...line} stroke-width="1.8" />
      {level >= 1 && (
        <>
          <ellipse cx="8.5" cy="18" rx="2.2" ry="1.3" fill="#E8645A" opacity={0.25 + level * 0.12} />
          <ellipse cx="23.5" cy="18" rx="2.2" ry="1.3" fill="#E8645A" opacity={0.25 + level * 0.12} />
        </>
      )}
      {eyes}
      <path d={mouth} fill="none" {...line} stroke-width="1.6" />
      {level === 4 && <path d="M24 6.5q1.6 1.8 0 3.6q-1.6-1.8 0-3.6z" fill="#8EC3E6" />}
    </svg>
  );
}
