import { sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Nuni schema (PLAN 앱 A › 구현 명세). Changes after S2 starts need Cozy's approval. */

export const entries = sqliteTable(
  'entries',
  {
    id: text('id').primaryKey(), // uuid v7
    date: text('date').notNull(), // 'YYYY-MM-DD', device local date at write time
    mood: integer('mood').notNull(),
    note: text('note'), // length limit (200 / 2,000) is validated in the app
    createdAt: integer('created_at').notNull(), // unix ms
    updatedAt: integer('updated_at').notNull(),
  },
  (t) => [
    index('idx_entries_date').on(t.date),
    check('entries_mood_range', sql`${t.mood} BETWEEN 1 AND 5`),
  ],
);

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  nameKey: text('name_key'), // i18n key for default tags (tags.sleep …), NULL for custom
  customName: text('custom_name'),
  icon: text('icon').notNull(), // Phosphor icon name
  sortOrder: integer('sort_order').notNull(),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

export const entryTags = sqliteTable(
  'entry_tags',
  {
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.entryId, t.tagId] }), index('idx_entry_tags_tag').on(t.tagId)],
);

export const photos = sqliteTable(
  'photos',
  {
    id: text('id').primaryKey(),
    entryId: text('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(), // relative to Documents/photos/
    width: integer('width'),
    height: integer('height'),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [index('idx_photos_entry').on(t.entryId)],
);

export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type Photo = typeof photos.$inferSelect;
