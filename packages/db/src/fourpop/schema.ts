import { desc } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Fourpop schema (PLAN 앱 B › 구현 명세). */

export const strips = sqliteTable(
  'strips',
  {
    id: text('id').primaryKey(), // uuid v7
    createdAt: integer('created_at').notNull(),
    layout: text('layout').notNull(), // 'strip4'
    frameId: text('frame_id').notNull(), // manifest item id
    packId: text('pack_id').notNull(),
    filter: text('filter').notNull(),
    hd: integer('hd', { mode: 'boolean' }).notNull().default(false),
    fileName: text('file_name').notNull(), // Documents/strips/<id>.jpg (standard quality)
    thumbName: text('thumb_name').notNull(), // 300px
    width: integer('width').notNull(),
    height: integer('height').notNull(),
  },
  (t) => [index('idx_strips_created').on(desc(t.createdAt))],
);

export const installedPacks = sqliteTable('installed_packs', {
  id: text('id').primaryKey(), // pack id
  manifestJson: text('manifest_json').notNull(), // Pack JSON at install time
  installedAt: integer('installed_at').notNull(),
  version: integer('version').notNull(),
});

export type Strip = typeof strips.$inferSelect;
export type InstalledPack = typeof installedPacks.$inferSelect;
