import { useEffect, useMemo, useState } from 'preact/hooks';
import { DrinkGrid, EntryList, NoteEditor, sumGrams } from '../components';
import { addMonths, daysInMonth, monthKey, parseKey } from '../date';
import { useI18n } from '../i18n';
import { MoodFace } from '../icons';
import { gramsOf, useData } from '../store';
import { Sheet } from '../ui';

const level = (g: number, guide: number) => (g <= 0 ? 0 : g < guide / 2 ? 1 : g < guide ? 2 : g < guide * 2 ? 3 : 4);

const niceMax = (v: number) => {
  const step = v <= 40 ? 10 : v <= 100 ? 20 : 50;
  return Math.ceil(v / step) * step;
};

export function History({ today }: { today: string }) {
  const data = useData();
  const { t, amt, lang } = useI18n();
  const [month, setMonth] = useState(monthKey(today));
  const [openDay, setOpenDay] = useState<string | null>(null);
  const guide = data.settings.guideline;

  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of data.entries) m.set(e.day, (m.get(e.day) ?? 0) + gramsOf(e));
    return m;
  }, [data.entries]);

  const n = daysInMonth(month);
  const days = Array.from({ length: n }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`);
  const values = days.map((d) => byDay.get(d) ?? 0);

  const isCurrent = month === monthKey(today);
  const isFuture = month > monthKey(today);
  const elapsed = isFuture ? 0 : isCurrent ? Number(today.slice(8)) : n;
  const drank = values.filter((v) => v > 0);
  const total = drank.reduce((a, b) => a + b, 0);

  const monthFmt = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long' });
  const weekStart = data.settings.weekStart;
  const lead = (parseKey(days[0]).getDay() - weekStart + 7) % 7;
  // 2024-01-07 is a Sunday.
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const dow = (weekStart + i) % 7;
    return { dow, label: new Intl.DateTimeFormat(lang, { weekday: 'narrow' }).format(new Date(2024, 0, 7 + dow)) };
  });

  return (
    <div class="screen history">
      <header class="month-nav">
        <button class="icon-btn" aria-label={t('hist.prev')} onClick={() => setMonth(addMonths(month, -1))}>
          <Chevron dir="left" />
        </button>
        <h1 class="month-title">{monthFmt.format(parseKey(days[0]))}</h1>
        <button class="icon-btn" aria-label={t('hist.next')} onClick={() => setMonth(addMonths(month, 1))} disabled={isCurrent}>
          <Chevron dir="right" />
        </button>
      </header>

      <dl class="stats">
        <div>
          <dt>{t('hist.drinkDays')}</dt>
          <dd class="num">
            {drank.length}
            <small>/{elapsed}</small>
          </dd>
        </div>
        <div>
          <dt>{t('hist.dryDays')}</dt>
          <dd class="num">{Math.max(0, elapsed - drank.length)}</dd>
        </div>
        <div>
          <dt>{t('hist.avg')}</dt>
          <dd class="num">{drank.length ? amt(total / drank.length) : '—'}</dd>
        </div>
        <div>
          <dt>{t('hist.total')}</dt>
          <dd class="num">{amt(total, 0)}</dd>
        </div>
      </dl>

      <section class="calendar">
        <div class="cal-grid cal-head">
          {weekdays.map(({ dow, label }) => (
            <span key={dow} class={dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}>
              {label}
            </span>
          ))}
        </div>
        <div class="cal-grid">
          {Array.from({ length: lead }, (_, i) => (
            <span key={`b${i}`} />
          ))}
          {days.map((d, i) => {
            const v = values[i];
            const note = data.notes[d];
            const future = d > today;
            return (
              <button
                key={d}
                class={`cal-day lv${level(v, guide)}${d === today ? ' is-today' : ''}`}
                disabled={future}
                onClick={() => setOpenDay(d)}
                aria-label={`${d} ${v ? amt(v) : ''}`}
              >
                <span class="cal-n num">{i + 1}</span>
                {note?.mood !== undefined
                  ? <span class="cal-mood"><MoodFace level={note.mood} size={12} /></span>
                  : (note?.memo || note?.hangover) && <span class="cal-mark" />}
              </button>
            );
          })}
        </div>
        <div class="legend">
          <span>{t('hist.less')}</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <i key={l} class={`sw lv${l}`} />
          ))}
          <span>{t('hist.more')}</span>
        </div>
      </section>

      <section class="block">
        <h2 class="block-title">{t('hist.daily')}</h2>
        <BarChart days={days} values={values} guide={guide} />
        <p class="hint left">{t('hist.dailyHint')}</p>
      </section>

      <section class="block">
        <h2 class="block-title">
          {t('hist.tolerance')}
          <span class="block-aside">{t('hist.allTime')}</span>
        </h2>
        <Tolerance byDay={byDay} />
      </section>

      <DaySheet day={openDay} onClose={() => setOpenDay(null)} />
    </div>
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M14.5 6l-6 6 6 6' : 'M9.5 6l6 6-6 6'}
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}

/* ---------- daily bars ---------- */

function BarChart({ days, values, guide }: { days: string[]; values: number[]; guide: number }) {
  const { amt, amtNum, lang } = useI18n();
  const [sel, setSel] = useState<number | null>(null);
  const W = 340;
  const H = 150;
  const L = 26;
  const B = 18;
  const T = 6;
  const max = niceMax(Math.max(guide * 1.5, ...values));
  const slot = (W - L) / days.length;
  const bw = Math.max(2, slot - 2);
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const base = y(0);
  const dayFmt = new Intl.DateTimeFormat(lang, { month: 'short', day: 'numeric', weekday: 'short' });
  const ticks = [1, 10, 20, days.length];

  const bar = (x: number, top: number) => {
    const h = base - top;
    const r = Math.min(4, bw / 2, h);
    return `M${x} ${base}V${top + r}q0 -${r} ${r} -${r}h${bw - 2 * r}q${r} 0 ${r} ${r}V${base}z`;
  };

  const sv = sel !== null ? values[sel] : null;

  return (
    <div class="chart">
      <div class="readout" aria-live="polite">
        {sel !== null ? (
          <>
            <span>{dayFmt.format(parseKey(days[sel]))}</span>
            <b class="num">{sv ? amt(sv) : '—'}</b>
          </>
        ) : (
          <span class="muted">&nbsp;</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} class="chart-svg" onPointerLeave={() => setSel(null)}>
        {[0, max / 2, max].map((v) => (
          <g key={v}>
            <line x1={L} x2={W} y1={y(v)} y2={y(v)} class={v === 0 ? 'axis' : 'grid'} />
            <text x={L - 6} y={y(v) + 3.5} class="tick" text-anchor="end">
              {amtNum(v, 0)}
            </text>
          </g>
        ))}
        {values.map((v, i) =>
          v > 0 ? (
            <path key={i} d={bar(L + i * slot + 1, y(v))} class={`bar${sel === i ? ' is-sel' : ''}${v > guide ? ' is-over' : ''}`} />
          ) : null,
        )}
        <line x1={L} x2={W} y1={y(guide)} y2={y(guide)} class="guide" />
        {ticks.map((d) => (
          <text key={d} x={L + (d - 0.5) * slot} y={H - 4} class="tick" text-anchor="middle">
            {d}
          </text>
        ))}
        {values.map((_, i) => (
          <rect
            key={`h${i}`}
            x={L + i * slot}
            y={0}
            width={slot}
            height={H - B}
            fill="transparent"
            onPointerEnter={() => setSel(i)}
            onPointerDown={() => setSel(i)}
          />
        ))}
      </svg>
    </div>
  );
}

/* ---------- tolerance: amount by mood ---------- */

function Tolerance({ byDay }: { byDay: Map<string, number> }) {
  const { notes } = useData();
  const { t, amt } = useI18n();

  const rows = [0, 1, 2, 3, 4]
    .map((lv) => {
      const vals = Object.entries(notes)
        .filter(([d, n]) => n.mood === lv && (byDay.get(d) ?? 0) > 0)
        .map(([d]) => byDay.get(d)!);
      if (!vals.length) return null;
      return {
        lv,
        n: vals.length,
        min: Math.min(...vals),
        max: Math.max(...vals),
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  if (!rows.length) return <p class="empty">{t('hist.noMood')}</p>;

  const scale = niceMax(Math.max(...rows.map((r) => r.max)));
  const pct = (v: number) => `${(v / scale) * 100}%`;

  return (
    <>
      <ul class="tol">
        {rows.map((r) => (
          <li key={r.lv} class="tol-row">
            <span class="tol-label">
              <MoodFace level={r.lv} size={24} />
              {t(`mood.${r.lv}` as 'mood.0')}
            </span>
            <span class="tol-track">
              <span class="tol-band" style={{ left: pct(r.min), width: `calc(${pct(r.max - r.min)} + 2px)` }} />
              <span class="tol-dot" style={{ left: pct(r.avg) }} />
            </span>
            <span class="tol-val">
              <b class="num">{amt(r.avg, 0)}</b>
              <small>{t('hist.nDays', { n: r.n })}</small>
            </span>
          </li>
        ))}
      </ul>
      <p class="hint left">{t('hist.toleranceHint')}</p>
    </>
  );
}

/* ---------- day detail ---------- */

function DaySheet({ day, onClose }: { day: string | null; onClose: () => void }) {
  const data = useData();
  const { t, amt, lang } = useI18n();
  const [adding, setAdding] = useState(false);
  const [lastDay, setLastDay] = useState<string | null>(null);
  useEffect(() => {
    if (!day) return;
    setLastDay(day);
    setAdding(false);
  }, [day]);
  // Keep showing the last day while the sheet animates closed.
  const d = day ?? lastDay;
  const entries = d ? data.entries.filter((e) => e.day === d) : [];
  const fmt = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <Sheet open={!!day} onClose={onClose} title={d ? fmt.format(parseKey(d)) : ''}>
      {d && (
        <div class="day">
          <p class="day-total num">{amt(sumGrams(entries))}</p>
          {entries.length ? <EntryList entries={entries} /> : <p class="empty">{t('day.empty')}</p>}
          {adding ? (
            <div class="day-add">
              <DrinkGrid day={d} compact />
            </div>
          ) : (
            <button class="btn btn-ghost btn-block" onClick={() => setAdding(true)}>
              + {t('day.add')}
            </button>
          )}
          <NoteEditor day={d} note={data.notes[d]} showHangover />
          <button class="btn btn-block" onClick={onClose}>
            {t('day.close')}
          </button>
        </div>
      )}
    </Sheet>
  );
}
