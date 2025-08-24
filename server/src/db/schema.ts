import { serial, text, pgTable, timestamp, integer, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// References table - main entity for UI references
export const referencesTable = pgTable('references', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url'), // Nullable - can be null for references without URLs
  description: text('description'), // Nullable
  notes: text('notes'), // Nullable
  tags: json('tags').$type<string[]>().notNull().default([]), // JSON array of tags
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Screenshots table - can be associated with references or independent
export const screenshotsTable = pgTable('screenshots', {
  id: serial('id').primaryKey(),
  reference_id: integer('reference_id'), // Nullable - can exist independently
  filename: text('filename').notNull(),
  original_filename: text('original_filename').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  alt_text: text('alt_text'), // Nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations between tables
export const referencesRelations = relations(referencesTable, ({ many }) => ({
  screenshots: many(screenshotsTable),
}));

export const screenshotsRelations = relations(screenshotsTable, ({ one }) => ({
  reference: one(referencesTable, {
    fields: [screenshotsTable.reference_id],
    references: [referencesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Reference = typeof referencesTable.$inferSelect; // For SELECT operations
export type NewReference = typeof referencesTable.$inferInsert; // For INSERT operations

export type Screenshot = typeof screenshotsTable.$inferSelect; // For SELECT operations
export type NewScreenshot = typeof screenshotsTable.$inferInsert; // For INSERT operations

// Export all tables and relations for proper query building
export const tables = { 
  references: referencesTable, 
  screenshots: screenshotsTable 
};

export const schema = {
  ...tables,
  referencesRelations,
  screenshotsRelations,
};