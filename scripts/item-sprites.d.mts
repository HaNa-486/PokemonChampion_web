export const ITEM_SPRITES_REPOSITORY: string;
export type ItemSpriteManifest = {
  schemaVersion: 1;
  generatedAt: string;
  source: { repository: string; revision: string; purpose: string; directories: string[] };
  counts: { items: number; available: number; missing: number };
  items: Record<string, { imageUrl: string; sourcePath: string }>;
  missing: string[];
};
export function resolveItemSpritePath(id: string, availablePaths: Set<string> | string[]): string | null;
export function fetchItemSpritePaths(revision: string): Promise<Set<string>>;
export function createItemSpriteManifest(items: Array<{ id: string }>, revision: string, availablePaths: Set<string> | string[], generatedAt?: string): ItemSpriteManifest;
export function manifestMatchesItems(items: Array<{ id: string }>, manifest: ItemSpriteManifest | null | undefined, revision: string): boolean;
export function auditItemSpriteAssets(manifest: unknown, projectRoot?: string): Promise<{ valid: boolean; missing: string[]; invalid: string[] }>;
export type StagedPath = { destination: string; staged: string };
export function stageItemSpriteAssets(manifest: ItemSpriteManifest, options?: { projectRoot?: string; force?: boolean }): Promise<StagedPath & { stats: { downloaded: number; unchanged: number; unavailable: number } }>;
export function publishStagedPathsAtomically(entries: StagedPath[], options?: {
  cleanupBackups?: (target: string) => Promise<void>;
  restoreBackup?: (backup: string, destination: string) => Promise<void>;
}): Promise<void>;
