export type AuditResult = { errors: string[]; warnings: string[]; checkedPokemon: number };
export function auditSnapshot(snapshot: Record<string, unknown>): AuditResult;
export function auditLiveContracts(snapshot: Record<string, unknown>): Promise<{ errors: string[]; sourceForms: number; relatedGroups: number }>;
