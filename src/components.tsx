import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { DrinkIcon, MoodFace, TINT } from './icons';
import { useI18n } from './i18n';
import { addEntry, gramsOf, removeEntry, restoreEntry, setNote, updateEntry, useData } from './store';
import { ICON_KEYS, type DayNote, type Drink, type Entry, type IconKey } from './types';
import { haptic, selectAll, Sheet, toast } from './ui';

/* ---------- number tween ---------- */

export function useTween(target: number, ms = 420): number {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    if (a === target) return;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      const cur = a + (target - a) * e;
      from.current = cur;
      setV(cur);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

/* ---------- drink tiles ---------- */

function Tile({ drink, onPick, onHold }: { drink: Drink; onPick: (d: Drink) => void; onHold: (d: Drink) => void }) {
  const { t, amt, name } = useI18n();
  const [floats, setFloats] = useState<number[]>([]);
  const [pressed, setPressed] = useState(false);
  const hold = useRef<{ timer: number; x: number; y: number; fired: boolean } | null>(null);

  const cancel = () => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
    setPressed(false);
  };

  const down = (e: PointerEvent) => {
    if (e.button !== 0) return;
    setPressed(true);
    const h = {
      x: e.clientX,
      y: e.clientY,
      fired: false,
      timer: window.setTimeout(() => {
        h.fired = true;
        setPressed(false);
        haptic();
        onHold(drink);
      }, 480),
    };
    hold.current = h;
  };

  const move = (e: PointerEvent) => {
    const h = hold.current;
    if (h && Math.hypot(e.clientX - h.x, e.clientY - h.y) > 10) cancel();
  };

  const up = () => {
    const h = hold.current;
    cancel();
    if (!h || h.fired) return;
    haptic();
    onPick(drink);
    const id = Date.now();
    setFloats((f) => [...f, id]);
    setTimeout(() => setFloats((f) => f.filter((x) => x !== id)), 900);
  };

  return (
    <div class="tile-wrap">
      <button
        class={`tile${pressed ? ' is-pressed' : ''}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onPick(drink);
          }
        }}
      >
        <span class="tile-plate" style={{ background: TINT[drink.icon] }}>
          <DrinkIcon icon={drink.icon} size={52} />
        </span>
        <span class="tile-name">{name(drink)}</span>
        <span class="tile-spec">
          {drink.abv}% · {drink.ml}ml
        </span>
        {floats.map((id) => (
          <span class="tile-float" key={id}>
            +{amt(gramsOf(drink))}
          </span>
        ))}
      </button>
      <button class="tile-adjust" aria-label={`${name(drink)} — ${t('pour.adjust')}`} onClick={() => onHold(drink)}>
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2.5 5h7M12.5 5h1M2.5 11h1M6.5 11h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="11" cy="5" r="1.6" fill="none" stroke="currentColor" stroke-width="1.5" />
          <circle cx="5" cy="11" r="1.6" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>
  );
}

export function DrinkGrid({ day, compact = false }: { day?: string; compact?: boolean }) {
  const { drinks } = useData();
  const { t, name } = useI18n();
  const [pour, setPour] = useState<PourTarget | null>(null);

  const log = (d: Drink, p?: { abv: number; ml: number }) => {
    const entry = addEntry(d, day, p);
    toast(t('toast.added', { name: name(d) }), {
      label: t('toast.undo'),
      run: () => removeEntry(entry.id),
    });
  };

  return (
    <>
      <div class={`grid${compact ? ' grid-compact' : ''}`}>
        {drinks.map((d) => (
          <Tile key={d.id} drink={d} onPick={log} onHold={(d) => setPour({ mode: 'pour', base: d })} />
        ))}
        <button
          class="tile tile-custom"
          onClick={() => setPour({ mode: 'custom', base: { id: '', icon: 'bottle', abv: 5, ml: 350 } })}
        >
          <span class="tile-plate">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </span>
          <span class="tile-name">{t('pour.custom')}</span>
          <span class="tile-spec">{t('pour.customSpec')}</span>
        </button>
      </div>
      <PourSheet
        target={pour}
        onClose={() => setPour(null)}
        onSubmit={(v) => {
          const d = pour!.base as Drink;
          log(pour!.mode === 'custom' ? { ...d, id: '', name: v.name || t('pour.custom'), icon: v.icon } : d, v);
          setPour(null);
        }}
      />
    </>
  );
}

/* ---------- adjust / custom / edit a pour ---------- */

export interface PourTarget {
  /** pour: log a list drink with changes · custom: free entry · edit: fix a logged entry */
  mode: 'pour' | 'custom' | 'edit';
  base: { id: string; preset?: string; name?: string; icon: IconKey; abv: number; ml: number };
}

interface PourValues {
  name: string;
  icon: IconKey;
  abv: number;
  ml: number;
}

const ABV_CHIPS = [5, 7, 9, 12, 15, 25, 40];
const ML_CHIPS = [30, 60, 90, 120, 180, 350, 500];

export function IconPicker({ value, onChange }: { value: IconKey; onChange: (k: IconKey) => void }) {
  return (
    <div class="icon-pick">
      {ICON_KEYS.map((k) => (
        <button
          type="button"
          key={k}
          class={value === k ? 'is-on' : ''}
          aria-pressed={value === k}
          aria-label={k}
          style={{ background: TINT[k] }}
          onClick={() => onChange(k)}
        >
          <DrinkIcon icon={k} size={34} />
        </button>
      ))}
    </div>
  );
}

export function PourSheet({
  target,
  onClose,
  onSubmit,
}: {
  target: PourTarget | null;
  onClose: () => void;
  onSubmit: (v: PourValues) => void;
}) {
  const { t, amt, name } = useI18n();
  const [form, setForm] = useState({ name: '', icon: 'bottle' as IconKey, abv: '', ml: '' });
  const last = useRef<PourTarget | null>(null);
  if (target) last.current = target;
  const tg = last.current;

  useEffect(() => {
    if (target) {
      const b = target.base;
      setForm({ name: '', icon: b.icon, abv: String(b.abv), ml: String(b.ml) });
    }
  }, [target]);

  const a = parseFloat(form.abv);
  const m = parseFloat(form.ml);
  const valid = a >= 0 && a <= 100 && m > 0 && m <= 5000;
  const custom = tg?.mode === 'custom';
  const title = !tg ? '' : tg.mode === 'edit' ? t('pour.editTitle') : custom ? t('pour.customTitle') : t('pour.title');

  const numField = (key: 'abv' | 'ml', label: string, unit: string, mode: string) => (
    <label class="field">
      <span>{label}</span>
      <span class="input-unit">
        <input
          type="number"
          inputMode={mode as 'decimal'}
          step="any"
          value={form[key]}
          onFocus={selectAll}
          onInput={(e) => setForm({ ...form, [key]: e.currentTarget.value })}
        />
        <i>{unit}</i>
      </span>
    </label>
  );

  const chip = (key: 'abv' | 'ml', v: number, label: string | number = v) => (
    <button
      type="button"
      key={`${key}${v}`}
      class={`chip${parseFloat(form[key]) === v ? ' is-on' : ''}`}
      onClick={() => setForm({ ...form, [key]: String(v) })}
    >
      {label}
    </button>
  );

  return (
    <Sheet open={!!target} onClose={onClose} title={title}>
      {tg && (
        <form
          class="pour"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) onSubmit({ name: form.name.trim(), icon: form.icon, abv: a, ml: m });
          }}
        >
          <div class="pour-head">
            <span class="tile-plate" style={{ background: TINT[form.icon] }}>
              <DrinkIcon icon={form.icon} size={44} />
            </span>
            <div>
              <div class="pour-name">{custom ? form.name.trim() || t('pour.custom') : name(tg.base)}</div>
              <div class="pour-g num">{valid ? amt(gramsOf({ abv: a, ml: m })) : '—'}</div>
            </div>
          </div>

          {custom && (
            <>
              <label class="field">
                <span>{t('edit.name')}</span>
                <input
                  type="text"
                  value={form.name}
                  maxLength={40}
                  placeholder={t('pour.namePh')}
                  onInput={(e) => setForm({ ...form, name: e.currentTarget.value })}
                />
              </label>
              <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
            </>
          )}

          <div class="field-row">
            {numField('abv', t('pour.abv'), '%', 'decimal')}
            {numField('ml', t('pour.ml'), 'ml', 'decimal')}
          </div>

          {custom ? (
            <>
              <div class="chips">{ABV_CHIPS.map((v) => chip('abv', v, `${v}%`))}</div>
              <div class="chips">{ML_CHIPS.map((v) => chip('ml', v))}</div>
            </>
          ) : (
            <div class="chips">
              {chip('ml', Math.round(tg.base.ml / 2), `${t('pour.half')} ${Math.round(tg.base.ml / 2)}`)}
              {chip('ml', tg.base.ml, `×1 ${tg.base.ml}`)}
              {chip('ml', Math.round(tg.base.ml * 1.5), `×1.5 ${Math.round(tg.base.ml * 1.5)}`)}
              {chip('ml', tg.base.ml * 2, `${t('pour.double')} ${tg.base.ml * 2}`)}
            </div>
          )}

          <button type="submit" class="btn btn-primary btn-block" disabled={!valid}>
            {tg.mode === 'edit' ? t('pour.save') : t('pour.add')}
          </button>
        </form>
      )}
    </Sheet>
  );
}

/* ---------- entries of a day ---------- */

export function EntryList({ entries }: { entries: Entry[] }) {
  const { t, amt, name, lang } = useI18n();
  const [editing, setEditing] = useState<Entry | null>(null);
  const target = useMemo<PourTarget | null>(() => editing && { mode: 'edit', base: editing }, [editing]);
  const time = new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' });
  return (
    <>
    <ul class="entries">
      {[...entries].reverse().map((e) => (
        <li key={e.id} class="entry">
          <button class="entry-edit" aria-label={`${name(e)} — ${t('pour.editTitle')}`} onClick={() => setEditing(e)}>
            <span class="entry-icon" style={{ background: TINT[e.icon] }}>
              <DrinkIcon icon={e.icon} size={30} />
            </span>
            <span class="entry-main">
              <span class="entry-name">{name(e)}</span>
              <span class="entry-spec">
                {time.format(e.ts)} · {e.abv}% · {e.ml}ml
              </span>
            </span>
            <span class="entry-g num">{amt(gramsOf(e))}</span>
          </button>
          <button
            class="icon-btn entry-del"
            aria-label={t('day.remove')}
            onClick={() => {
              removeEntry(e.id);
              toast(t('toast.removed'), { label: t('toast.undo'), run: () => restoreEntry(e) });
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
    <PourSheet
      target={target}
      onClose={() => setEditing(null)}
      onSubmit={(v) => {
        updateEntry(editing!.id, { abv: v.abv, ml: v.ml });
        toast(t('toast.updated'));
        setEditing(null);
      }}
    />
    </>
  );
}

/* ---------- mood + memo ---------- */

export function NoteEditor({ day, note, showHangover }: { day: string; note?: DayNote; showHangover?: boolean }) {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);

  // Reset textarea imperatively when day or persisted memo changes.
  // Uncontrolled textarea avoids iOS Safari IME doubling (controlled value
  // fights the IME confirmation and inserts the text twice).
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.value = note?.memo ?? '';
  }, [day, note?.memo]);

  return (
    <div class="note">
      <div class="moods" role="radiogroup" aria-label={t('today.howFeel')}>
        {[0, 1, 2, 3, 4].map((lv) => (
          <button
            key={lv}
            role="radio"
            aria-checked={note?.mood === lv}
            class={`mood${note?.mood === lv ? ' is-on' : ''}`}
            onClick={() => {
              haptic();
              setNote(day, { mood: note?.mood === lv ? undefined : lv });
            }}
          >
            <MoodFace level={lv} size={34} />
            <span>{t(`mood.${lv}` as 'mood.0')}</span>
          </button>
        ))}
      </div>
      {showHangover && (
        <label class="check">
          <input
            type="checkbox"
            checked={!!note?.hangover}
            onChange={(e) => setNote(day, { hangover: e.currentTarget.checked })}
          />
          <span class="check-box" aria-hidden="true" />
          {t('note.hangover')}
        </label>
      )}
      <textarea
        ref={textareaRef}
        class="memo"
        rows={2}
        placeholder={t('note.memoPh')}
        aria-label={t('note.memo')}
        defaultValue={note?.memo ?? ''}
        maxLength={2000}
        onCompositionStart={() => { composing.current = true; }}
        onCompositionEnd={(e) => {
          composing.current = false;
          setNote(day, { memo: e.currentTarget.value });
        }}
        onInput={(e) => {
          if (composing.current) return;
          setNote(day, { memo: e.currentTarget.value });
        }}
      />
    </div>
  );
}

export const sumGrams = (entries: Entry[]) => entries.reduce((s, e) => s + gramsOf(e), 0);
