CREATE TABLE `abilities` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_slug` text NOT NULL,
	`name_en` text NOT NULL,
	`name_zh_hant` text,
	`effect_en` text,
	`effect_zh_hant` text,
	`is_available` integer DEFAULT true NOT NULL,
	`source_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `abilities_canonical_slug_unique` ON `abilities` (`canonical_slug`);--> statement-breakpoint
CREATE TABLE `battle_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`ruleset_id` text NOT NULL,
	`format` text NOT NULL,
	`season_code` text NOT NULL,
	`snapshot_date` text NOT NULL,
	`source_id` text NOT NULL,
	`source_url` text NOT NULL,
	`source_data_version` text,
	`checksum` text NOT NULL,
	`status` text NOT NULL,
	`validation_report` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`ruleset_id`) REFERENCES `rulesets`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `snapshots_active_idx` ON `battle_snapshots` (`status`,`format`,`snapshot_date`);--> statement-breakpoint
CREATE TABLE `data_overrides` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`ruleset_id` text,
	`field_path` text NOT NULL,
	`locale` text,
	`old_value` text,
	`new_value` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_by` text NOT NULL,
	`reviewed_by` text,
	`published_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`ruleset_id`) REFERENCES `rulesets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `overrides_entity_idx` ON `data_overrides` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `overrides_status_idx` ON `data_overrides` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `data_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`base_url` text NOT NULL,
	`license_url` text,
	`attribution_text` text NOT NULL,
	`last_success_at` integer,
	`last_failure_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `data_sources_code_unique` ON `data_sources` (`code`);--> statement-breakpoint
CREATE TABLE `external_identifiers` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text,
	`external_key` text,
	`external_name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_source_key_uidx` ON `external_identifiers` (`source_id`,`entity_type`,`external_key`);--> statement-breakpoint
CREATE INDEX `external_entity_idx` ON `external_identifiers` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_slug` text NOT NULL,
	`name_en` text NOT NULL,
	`name_zh_hant` text,
	`category` text,
	`effect_en` text,
	`effect_zh_hant` text,
	`is_available` integer DEFAULT true NOT NULL,
	`source_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `items_canonical_slug_unique` ON `items` (`canonical_slug`);--> statement-breakpoint
CREATE TABLE `moves` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_slug` text NOT NULL,
	`name_en` text NOT NULL,
	`name_zh_hant` text,
	`type` text NOT NULL,
	`damage_class` text NOT NULL,
	`power` integer,
	`accuracy` integer,
	`pp` integer,
	`priority` integer DEFAULT 0 NOT NULL,
	`target` text,
	`short_effect_en` text,
	`short_effect_zh_hant` text,
	`is_available` integer DEFAULT true NOT NULL,
	`source_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `moves_canonical_slug_unique` ON `moves` (`canonical_slug`);--> statement-breakpoint
CREATE INDEX `moves_priority_idx` ON `moves` (`priority`);--> statement-breakpoint
CREATE INDEX `moves_type_priority_idx` ON `moves` (`type`,`priority`);--> statement-breakpoint
CREATE TABLE `pokemon_forms` (
	`id` text PRIMARY KEY NOT NULL,
	`species_key` text NOT NULL,
	`canonical_slug` text NOT NULL,
	`name_en` text NOT NULL,
	`name_zh_hant` text,
	`saved_name` text,
	`type_1` text NOT NULL,
	`type_2` text,
	`hp` integer NOT NULL,
	`attack` integer NOT NULL,
	`defense` integer NOT NULL,
	`special_attack` integer NOT NULL,
	`special_defense` integer NOT NULL,
	`speed` integer NOT NULL,
	`is_available` integer DEFAULT true NOT NULL,
	`sprite_url` text,
	`source_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `data_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pokemon_forms_canonical_slug_unique` ON `pokemon_forms` (`canonical_slug`);--> statement-breakpoint
CREATE INDEX `pokemon_species_idx` ON `pokemon_forms` (`species_key`);--> statement-breakpoint
CREATE INDEX `pokemon_available_speed_idx` ON `pokemon_forms` (`is_available`,`speed`);--> statement-breakpoint
CREATE TABLE `rulesets` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`season_code` text NOT NULL,
	`status` text NOT NULL,
	`calculation_version` text NOT NULL,
	`source_data_version` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rulesets_code_unique` ON `rulesets` (`code`);--> statement-breakpoint
CREATE INDEX `rulesets_status_idx` ON `rulesets` (`status`);