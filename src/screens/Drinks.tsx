import { useEffect, useRef, useState } from 'preact/hooks';
import { DrinkIcon, TINT } from '../icons';
import { useI18n } from '../i18n';
import { deleteDrink, gramsOf, moveDrink, restorePresets, saveDrink, uid, useData } from '../store';
import type { Drink } from '../types';
import { IconPicker } from '../components';
import { confirmSheet, haptic, selectAll, Sheet, toast } from '../ui';

const ROW = 72; // row height + gap, keep in sync with .drink-row in CSS

interface Drag {
  id: string;
  from: number;
  to: number;
  startY: number;
  dy: number;
}

export function Drinks() {
  const { drinks } = useData();
  const { t, amt, name } = useI18n();
  const [drag, setDrag] = useState<Drag | null>(null);
  const [settling, setSettling] = useState(false);
  const [editing, setEditing] = useState<Drink | null>(null);
  const dragRef = useRef<Drag | null>(null);
  dragRef.current = drag;

  useEffect(() => {
    if (!settling) return;
    const r = requestAnimationFrame(() => setSettling(false));
    return () => cancelAnimationFrame(r);
  }, [settling]);

  const startDrag = (e: PointerEvent, id: string, from: number) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    haptic();
    setDrag({ id, from, to: from, startY: e.clientY, dy: 0 });
  };

  const onMove = (e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = Math.max(-d.from * ROW, Math.min((drinks.length - 1 - d.from) * ROW, e.clientY - d.startY));
    const to = Math.max(0, Math.min(drinks.length - 1, Math.round(d.from + dy / ROW)));
    if (to !== d.to) haptic();
    setDrag({ ...d, dy, to });
  };

  const endDrag = () => {
    const d = dragRef.current;
    if (!d) return;
    setSettling(true);
    setDrag(null);
    if (d.to !== d.from) moveDrink(d.from, d.to);
  };

  const shift = (i: number) => {
    if (!drag || i === drag.from) return 0;
    if (drag.from < drag.to && i > drag.from && i <= drag.to) return -ROW;
    if (drag.from > drag.to && i >= drag.to && i < drag.from) return ROW;
    return 0;
  };

  return (
    <div class="screen drinks">
      <header class="page-head">
        <h1>{t('drinks.title')}</h1>
        <p class="hint left">{t('drinks.hint')}</p>
      </header>

      <ul class={`drink-list${drag ? ' is-dragging' : ''}${settling ? ' no-anim' : ''}`}>
        {drinks.map((d, i) => {
          const active = drag?.id === d.id;
          return (
            <li
              key={d.id}
              class={`drink-row${active ? ' is-active' : ''}`}
              style={{ transform: `translateY(${active ? drag!.dy : shift(i)}px)` }}
            >
              <button class="drink-row-main" onClick={() => setEditing(d)}>
                <span class="tile-plate sm" style={{ background: TINT[d.icon] }}>
                  <DrinkIcon icon={d.icon} size={36} />
                </span>
                <span class="drink-row-text">
                  <span class="drink-row-name">{name(d)}</span>
                  <span class="drink-row-spec">
                    {d.abv}% · {d.ml}ml · <span class="num">{amt(gramsOf(d))}</span>
                  </span>
                </span>
              </button>
              <button
                class="grip"
                aria-label={`${name(d)} — ${t('drinks.moveUp')} / ${t('drinks.moveDown')}`}
                onPointerDown={(e) => startDrag(e, d.id, i)}
                onPointerMove={onMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' && i > 0) {
                    e.preventDefault();
                    moveDrink(i, i - 1);
                  }
                  if (e.key === 'ArrowDown' && i < drinks.length - 1) {
                    e.preventDefault();
                    moveDrink(i, i + 1);
                  }
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  {[6, 10, 14].map((y) => (
                    <g key={y}>
                      <circle cx="7" cy={y} r="1.4" fill="currentColor" />
                      <circle cx="13" cy={y} r="1.4" fill="currentColor" />
                    </g>
                  ))}
                </svg>
              </button>
            </li>
          );
        })}
      </ul>

      <div class="stack">
        <button
          class="btn btn-primary btn-block"
          onClick={() => setEditing({ id: '', icon: 'bottle', abv: 5, ml: 350, name: '' })}
        >
          + {t('drinks.add')}
        </button>
        <button
          class="btn btn-ghost btn-block"
          onClick={() => {
            const n = restorePresets();
            toast(n ? t('drinks.restored', { n }) : t('drinks.none'));
          }}
        >
          {t('drinks.restore')}
        </button>
      </div>

      <EditSheet drink={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

const ML_CHIPS = [30, 60, 90, 120, 180, 250, 350, 500];

function EditSheet({ drink, onClose }: { drink: Drink | null; onClose: () => void }) {
  const { t, amt, name } = useI18n();
  const [form, setForm] = useState({ name: '', icon: 'bottle' as Drink['icon'], abv: '', ml: '' });
  const last = useRef<Drink | null>(null);
  if (drink) last.current = drink;
  const d = last.current;
  const isNew = !d?.id;

  useEffect(() => {
    if (drink) setForm({ name: drink.name ?? '', icon: drink.icon, abv: String(drink.abv), ml: String(drink.ml) });
  }, [drink]);

  const abv = parseFloat(form.abv);
  const ml = parseFloat(form.ml);
  const nameOk = !!form.name.trim() || !!d?.preset;
  const valid = nameOk && abv >= 0 && abv <= 100 && ml > 0 && ml <= 5000;

  const save = () => {
    if (!d || !valid) return;
    saveDrink({
      id: d.id || uid(),
      preset: d.preset,
      name: form.name.trim() || undefined,
      icon: form.icon,
      abv,
      ml,
    });
    onClose();
  };

  const remove = async () => {
    if (!d) return;
    const ok = await confirmSheet({
      title: t('edit.confirmDelete', { name: name(d) }),
      body: t('edit.confirmDeleteBody'),
      ok: t('common.delete'),
      danger: true,
    });
    if (ok) {
      deleteDrink(d.id);
      onClose();
    }
  };

  return (
    <Sheet open={!!drink} onClose={onClose} title={isNew ? t('edit.new') : t('edit.edit')}>
      {d && (
        <form
          class="edit"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div class="edit-preview">
            <span class="tile-plate lg" style={{ background: TINT[form.icon] }}>
              <DrinkIcon icon={form.icon} size={64} />
            </span>
            <span class="edit-per">{abv >= 0 && ml > 0 ? t('edit.per', { v: amt(gramsOf({ abv, ml })) }) : ' '}</span>
          </div>

          <label class="field">
            <span>{t('edit.name')}</span>
            <input
              type="text"
              value={form.name}
              maxLength={40}
              placeholder={d.preset ? name({ preset: d.preset }) : ''}
              onInput={(e) => setForm({ ...form, name: e.currentTarget.value })}
            />
          </label>

          <fieldset class="field">
            <legend>{t('edit.icon')}</legend>
            <IconPicker value={form.icon} onChange={(icon) => setForm({ ...form, icon })} />
          </fieldset>

          <div class="field-row">
            <label class="field">
              <span>{t('edit.abv')}</span>
              <span class="input-unit">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  max="100"
                  value={form.abv}
                  onFocus={selectAll}
                  onInput={(e) => setForm({ ...form, abv: e.currentTarget.value })}
                />
                <i>%</i>
              </span>
            </label>
            <label class="field">
              <span>{t('edit.ml')}</span>
              <span class="input-unit">
                <input
                  type="number"
                  inputMode="numeric"
                  step="any"
                  min="1"
                  value={form.ml}
                  onFocus={selectAll}
                  onInput={(e) => setForm({ ...form, ml: e.currentTarget.value })}
                />
                <i>ml</i>
              </span>
            </label>
          </div>
          <div class="chips">
            {ML_CHIPS.map((v) => (
              <button
                type="button"
                key={v}
                class={`chip${ml === v ? ' is-on' : ''}`}
                onClick={() => setForm({ ...form, ml: String(v) })}
              >
                {v}
              </button>
            ))}
          </div>

          <button type="submit" class="btn btn-primary btn-block" disabled={!valid}>
            {t('edit.save')}
          </button>
          {!isNew && (
            <button type="button" class="btn btn-text-danger btn-block" onClick={remove}>
              {t('edit.delete')}
            </button>
          )}
        </form>
      )}
    </Sheet>
  );
}
