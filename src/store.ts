import { useEffect, useState } from 'preact/hooks';
import { ICON_KEYS, type Data, type DayNote, type Drink, type Entry, type IconKey, type Settings } from './types';
import { presetDrinks, PRESETS } from './presets';
import { dayKeyAt } from './date';

const KEY = 'donndake:v1';

const DEFAULT_SETTINGS: Settings = { lang: 'auto', unit: 'g', dayStartHour: 5, guideline: 20, weekStart: 0 };

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const gramsOf = (d: { abv: number; ml: number }) => (d.ml * d.abv * 0.8) / 100;

/* ---------- validation ---------- */

const num = (v: unknown, min: number, max: number): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : undefined;
const str = (v: unknown, max = 200): string | undefined =>
  typeof v === 'string' && v.length <= max ? v : undefined;
const icon = (v: unknown): IconKey => (ICON_KEYS.includes(v as IconKey) ? (v as IconKey) : 'bottle');
const isDay = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

function normDrink(raw: any): Drink | null {
  if (!raw || typeof raw !== 'object') return null;
  const abv = num(raw.abv, 0, 100);
  const ml = num(raw.ml, 0, 5000);
  if (abv === undefined || ml === undefined) return null;
  const preset = PRESETS.some((p) => p.key === raw.preset) ? raw.preset : undefined;
  const name = str(raw.name, 60)?.trim() || undefined;
  if (!preset && !name) return null;
  return { id: str(raw.id, 64) || uid(), preset, name, icon: icon(raw.icon), abv, ml };
}

function normEntry(raw: any): Entry | null {
  if (!raw || typeof raw !== 'object' || !isDay(raw.day)) return null;
  const abv = num(raw.abv, 0, 100);
  const ml = num(raw.ml, 0, 5000);
  const ts = num(raw.ts, 0, 8.64e15);
  if (abv === undefined || ml === undefined || ts === undefined) return null;
  return {
    id: str(raw.id, 64) || uid(),
    day: raw.day,
    ts,
    drinkId: str(raw.drinkId, 64),
    preset: PRESETS.some((p) => p.key === raw.preset) ? raw.preset : undefined,
    name: str(raw.name, 60),
    icon: icon(raw.icon),
    abv,
    ml,
  };
}

function normNote(raw: any): DayNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const note: DayNote = {};
  const mood = num(raw.mood, 0, 4);
  if (mood !== undefined) note.mood = Math.round(mood);
  if (raw.hangover === true) note.hangover = true;
  const memo = str(raw.memo, 2000);
  if (memo) note.memo = memo;
  return Object.keys(note).length ? note : null;
}

/** Accepts anything (localStorage, imported file) and returns valid Data, or throws. */
export function normalize(raw: any, strict = false): Data {
  if (!raw || typeof raw !== 'object' || (strict && raw.app !== 'donndake' && raw.version !== 1)) {
    throw new Error('invalid');
  }
  const drinks = Array.isArray(raw.drinks) ? raw.drinks.map(normDrink).filter(Boolean) as Drink[] : null;
  const entries = Array.isArray(raw.entries) ? raw.entries.map(normEntry).filter(Boolean) as Entry[] : [];
  const notes: Record<string, DayNote> = {};
  if (raw.notes && typeof raw.notes === 'object') {
    for (const [k, v] of Object.entries(raw.notes)) {
      const n = normNote(v);
      if (isDay(k) && n) notes[k] = n;
    }
  }
  const s = raw.settings ?? {};
  const settings: Settings = {
    lang: ['auto', 'ja', 'en'].includes(s.lang) ? s.lang : DEFAULT_SETTINGS.lang,
    unit: s.unit === 'ml' ? 'ml' : 'g',
    dayStartHour: num(s.dayStartHour, 0, 6) ?? DEFAULT_SETTINGS.dayStartHour,
    guideline: num(s.guideline, 1, 500) ?? DEFAULT_SETTINGS.guideline,
    weekStart: s.weekStart === 1 ? 1 : 0,
  };
  if (strict && !drinks && !entries.length) throw new Error('invalid');
  return { version: 1, drinks: drinks ?? presetDrinks(), entries, notes, settings };
}

function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch {
    /* fall through to defaults */
  }
  return { version: 1, drinks: presetDrinks(), entries: [], notes: {}, settings: { ...DEFAULT_SETTINGS } };
}

/* ---------- store ---------- */

let state: Data = load();
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function set(next: Data) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — keep working in memory */
  }
  emit();
}

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load();
    emit();
  }
});

export const getData = () => state;

export function useData(): Data {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => void subs.delete(f);
  }, []);
  return state;
}

export const todayKey = () => dayKeyAt(Date.now(), state.settings.dayStartHour);

/* ---------- actions ---------- */

export function addEntry(drink: Drink, day = todayKey(), pour?: { abv: number; ml: number }): Entry {
  const entry: Entry = {
    id: uid(),
    day,
    ts: Date.now(),
    drinkId: drink.id,
    preset: drink.preset,
    name: drink.name,
    icon: drink.icon,
    abv: pour?.abv ?? drink.abv,
    ml: pour?.ml ?? drink.ml,
  };
  set({ ...state, entries: [...state.entries, entry] });
  return entry;
}

export function removeEntry(id: string) {
  set({ ...state, entries: state.entries.filter((e) => e.id !== id) });
}

export function updateEntry(id: string, patch: Partial<Pick<Entry, 'abv' | 'ml'>>) {
  set({ ...state, entries: state.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) });
}

export function restoreEntry(entry: Entry) {
  set({ ...state, entries: [...state.entries, entry].sort((a, b) => a.ts - b.ts) });
}

export function setNote(day: string, patch: Partial<DayNote>) {
  const note: DayNote = { ...state.notes[day], ...patch };
  (Object.keys(note) as (keyof DayNote)[]).forEach((k) => {
    if (note[k] === undefined || note[k] === '' || note[k] === false) delete note[k];
  });
  const notes = { ...state.notes };
  if (Object.keys(note).length) notes[day] = note;
  else delete notes[day];
  set({ ...state, notes });
}

export function saveDrink(drink: Drink) {
  const exists = state.drinks.some((d) => d.id === drink.id);
  set({
    ...state,
    drinks: exists ? state.drinks.map((d) => (d.id === drink.id ? drink : d)) : [...state.drinks, drink],
  });
}

export function deleteDrink(id: string) {
  set({ ...state, drinks: state.drinks.filter((d) => d.id !== id) });
}

export function moveDrink(from: number, to: number) {
  const drinks = [...state.drinks];
  const [d] = drinks.splice(from, 1);
  drinks.splice(to, 0, d);
  set({ ...state, drinks });
}

/** Re-adds any built-in drinks the user removed. Returns how many came back. */
export function restorePresets(): number {
  const have = new Set(state.drinks.map((d) => d.preset).filter(Boolean));
  const missing = presetDrinks().filter((d) => !have.has(d.preset));
  if (missing.length) set({ ...state, drinks: [...state.drinks, ...missing] });
  return missing.length;
}

export function setSettings(patch: Partial<Settings>) {
  set({ ...state, settings: { ...state.settings, ...patch } });
}

export function exportJSON(): string {
  return JSON.stringify({ app: 'donndake', exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importJSON(text: string): Data {
  const data = normalize(JSON.parse(text), true);
  set(data);
  return data;
}

export function clearAll() {
  set({ version: 1, drinks: presetDrinks(), entries: [], notes: {}, settings: { ...state.settings } });
}
