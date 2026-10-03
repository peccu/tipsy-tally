import type { Drink, IconKey } from './types';

interface Preset {
  key: string;
  icon: IconKey;
  abv: number;
  ml: number;
}

/** Typical servings in Japan. */
export const PRESETS: Preset[] = [
  { key: 'beerJug', icon: 'jug', abv: 5, ml: 350 },
  { key: 'beerCan', icon: 'can', abv: 5, ml: 350 },
  { key: 'highball', icon: 'highball', abv: 7, ml: 350 },
  { key: 'lemonSour', icon: 'sour', abv: 5, ml: 350 },
  { key: 'strongChuhai', icon: 'canLemon', abv: 9, ml: 350 },
  { key: 'wine', icon: 'wine', abv: 12, ml: 120 },
  { key: 'sparkling', icon: 'sparkling', abv: 11, ml: 120 },
  { key: 'sake', icon: 'sake', abv: 15, ml: 180 },
  { key: 'shochu', icon: 'shochu', abv: 25, ml: 90 },
  { key: 'whisky', icon: 'whisky', abv: 40, ml: 30 },
  { key: 'umeshu', icon: 'umeshu', abv: 12, ml: 90 },
  { key: 'cocktail', icon: 'cocktail', abv: 12, ml: 120 },
];

export const presetDrinks = (): Drink[] =>
  PRESETS.map((p) => ({ id: `p-${p.key}`, preset: p.key, icon: p.icon, abv: p.abv, ml: p.ml }));
