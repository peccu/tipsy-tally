export const ICON_KEYS = [
  'jug',
  'can',
  'canLemon',
  'bottle',
  'highball',
  'sour',
  'wine',
  'sparkling',
  'sake',
  'shochu',
  'whisky',
  'umeshu',
  'cocktail',
] as const;
export type IconKey = (typeof ICON_KEYS)[number];

export interface Drink {
  id: string;
  /** Built-in drinks keep a preset key so the name follows the UI language. */
  preset?: string;
  /** User-given name. Overrides the preset name when set. */
  name?: string;
  icon: IconKey;
  abv: number;
  ml: number;
}

/** A logged pour. Snapshots the drink so later edits don't rewrite history. */
export interface Entry {
  id: string;
  /** Logical drinking day (YYYY-MM-DD), respecting the day-start hour. */
  day: string;
  ts: number;
  drinkId?: string;
  preset?: string;
  name?: string;
  icon: IconKey;
  abv: number;
  ml: number;
}

export interface DayNote {
  /** 0 = sober … 4 = wasted */
  mood?: number;
  hangover?: boolean;
  memo?: string;
}

export type Lang = 'ja' | 'en';

export interface Settings {
  lang: 'auto' | Lang;
  unit: 'g' | 'ml';
  /** Hour (0–6) at which a new drinking day begins. */
  dayStartHour: number;
  /** Daily guideline in grams of pure alcohol. */
  guideline: number;
  /** First day of the calendar week: 0 = Sunday, 1 = Monday. */
  weekStart: 0 | 1;
}

export interface Data {
  version: 1;
  drinks: Drink[];
  entries: Entry[];
  notes: Record<string, DayNote>;
  settings: Settings;
}
