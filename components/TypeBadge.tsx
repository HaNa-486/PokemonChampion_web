import type { PokemonType } from "../lib/types";

export function TypeBadge({ type }: { type: PokemonType }) {
  return <span className={`type-badge type-${type.toLowerCase()}`}>{type}</span>;
}
