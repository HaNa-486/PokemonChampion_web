export function parseCsv(source: string): Array<Record<string, string>>;
export function normalizeChampionsPokemon(entry: Record<string, unknown>, origin?: string): {
  id: string; speciesKey: string; battleDataKey: string; name: string; savedName: string; types: string[];
  baseStats: Record<string, number>; imageUrl: string; moveNames: string[];
};
export function matchChampionsSourceForForm(form: Record<string, unknown>, entries: Array<Record<string, unknown>>): Record<string, unknown> | null;
