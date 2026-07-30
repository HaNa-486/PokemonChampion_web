import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
};

export const dataSources = sqliteTable("data_sources", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  baseUrl: text("base_url").notNull(),
  licenseUrl: text("license_url"),
  attributionText: text("attribution_text").notNull(),
  lastSuccessAt: integer("last_success_at", { mode: "timestamp_ms" }),
  lastFailureAt: integer("last_failure_at", { mode: "timestamp_ms" }),
  ...timestamps,
});

export const rulesets = sqliteTable("rulesets", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  seasonCode: text("season_code").notNull(),
  status: text("status", { enum: ["draft", "active", "archived"] }).notNull(),
  calculationVersion: text("calculation_version").notNull(),
  sourceDataVersion: text("source_data_version"),
  ...timestamps,
}, (table) => [index("rulesets_status_idx").on(table.status)]);

export const pokemonForms = sqliteTable("pokemon_forms", {
  id: text("id").primaryKey(),
  speciesKey: text("species_key").notNull(),
  canonicalSlug: text("canonical_slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameZhHant: text("name_zh_hant"),
  savedName: text("saved_name"),
  type1: text("type_1").notNull(),
  type2: text("type_2"),
  hp: integer("hp").notNull(),
  attack: integer("attack").notNull(),
  defense: integer("defense").notNull(),
  specialAttack: integer("special_attack").notNull(),
  specialDefense: integer("special_defense").notNull(),
  speed: integer("speed").notNull(),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  spriteUrl: text("sprite_url"),
  sourceId: text("source_id").references(() => dataSources.id),
  ...timestamps,
}, (table) => [index("pokemon_species_idx").on(table.speciesKey), index("pokemon_available_speed_idx").on(table.isAvailable, table.speed)]);

export const moves = sqliteTable("moves", {
  id: text("id").primaryKey(),
  canonicalSlug: text("canonical_slug").notNull().unique(),
  nameEn: text("name_en").notNull(),
  nameZhHant: text("name_zh_hant"),
  type: text("type").notNull(),
  damageClass: text("damage_class").notNull(),
  power: integer("power"),
  accuracy: integer("accuracy"),
  pp: integer("pp"),
  priority: integer("priority").notNull().default(0),
  target: text("target"),
  shortEffectEn: text("short_effect_en"),
  shortEffectZhHant: text("short_effect_zh_hant"),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  sourceId: text("source_id").references(() => dataSources.id),
  ...timestamps,
}, (table) => [index("moves_priority_idx").on(table.priority), index("moves_type_priority_idx").on(table.type, table.priority)]);

export const abilities = sqliteTable("abilities", {
  id: text("id").primaryKey(), canonicalSlug: text("canonical_slug").notNull().unique(), nameEn: text("name_en").notNull(), nameZhHant: text("name_zh_hant"), effectEn: text("effect_en"), effectZhHant: text("effect_zh_hant"), isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true), sourceId: text("source_id").references(() => dataSources.id), ...timestamps,
});

export const items = sqliteTable("items", {
  id: text("id").primaryKey(), canonicalSlug: text("canonical_slug").notNull().unique(), nameEn: text("name_en").notNull(), nameZhHant: text("name_zh_hant"), category: text("category"), effectEn: text("effect_en"), effectZhHant: text("effect_zh_hant"), isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true), sourceId: text("source_id").references(() => dataSources.id), ...timestamps,
});

export const externalIdentifiers = sqliteTable("external_identifiers", {
  id: text("id").primaryKey(), entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), sourceId: text("source_id").notNull().references(() => dataSources.id), externalId: text("external_id"), externalKey: text("external_key"), externalName: text("external_name"), ...timestamps,
}, (table) => [uniqueIndex("external_source_key_uidx").on(table.sourceId, table.entityType, table.externalKey), index("external_entity_idx").on(table.entityType, table.entityId)]);

export const battleSnapshots = sqliteTable("battle_snapshots", {
  id: text("id").primaryKey(), rulesetId: text("ruleset_id").notNull().references(() => rulesets.id), format: text("format", { enum: ["singles", "doubles"] }).notNull(), seasonCode: text("season_code").notNull(), snapshotDate: text("snapshot_date").notNull(), sourceId: text("source_id").notNull().references(() => dataSources.id), sourceUrl: text("source_url").notNull(), sourceDataVersion: text("source_data_version"), checksum: text("checksum").notNull(), status: text("status", { enum: ["staging", "active", "rejected", "superseded"] }).notNull(), validationReport: text("validation_report", { mode: "json" }).$type<Record<string, unknown>>(), ...timestamps,
}, (table) => [index("snapshots_active_idx").on(table.status, table.format, table.snapshotDate)]);

export const dataOverrides = sqliteTable("data_overrides", {
  id: text("id").primaryKey(), entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), rulesetId: text("ruleset_id").references(() => rulesets.id), fieldPath: text("field_path").notNull(), locale: text("locale"), oldValue: text("old_value", { mode: "json" }).$type<unknown>(), newValue: text("new_value", { mode: "json" }).notNull().$type<unknown>(), reason: text("reason").notNull(), status: text("status", { enum: ["draft", "published", "reverted"] }).notNull().default("draft"), createdBy: text("created_by").notNull(), reviewedBy: text("reviewed_by"), publishedAt: integer("published_at", { mode: "timestamp_ms" }), ...timestamps,
}, (table) => [index("overrides_entity_idx").on(table.entityType, table.entityId), index("overrides_status_idx").on(table.status, table.createdAt)]);

export type DataOverride = typeof dataOverrides.$inferSelect;
