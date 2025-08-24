import { db } from '../db';
import { referencesTable, screenshotsTable } from '../db/schema';
import { type SearchReferencesInput, type Reference } from '../schema';
import { and, or, ilike, exists, eq, desc, sql, SQL } from 'drizzle-orm';

export async function searchReferences(input: SearchReferencesInput): Promise<Reference[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Text search in title, description, and notes (case-insensitive)
    if (input.query && input.query.trim()) {
      const searchTerm = `%${input.query.trim()}%`;
      const textSearchConditions = [
        ilike(referencesTable.title, searchTerm),
        ilike(referencesTable.description, searchTerm),
        ilike(referencesTable.notes, searchTerm)
      ];
      conditions.push(or(...textSearchConditions)!);
    }

    // Tag filtering - references must have ALL specified tags
    if (input.tags && input.tags.length > 0) {
      // Use JSON contains operator to check if all tags are present
      for (const tag of input.tags) {
        conditions.push(
          sql`${referencesTable.tags}::jsonb ? ${tag}`
        );
      }
    }

    // URL presence filtering
    if (input.has_url !== undefined) {
      if (input.has_url) {
        conditions.push(sql`${referencesTable.url} IS NOT NULL AND ${referencesTable.url} != ''`);
      } else {
        conditions.push(sql`${referencesTable.url} IS NULL OR ${referencesTable.url} = ''`);
      }
    }

    // Screenshot presence filtering using EXISTS subquery
    if (input.has_screenshots !== undefined) {
      if (input.has_screenshots) {
        conditions.push(
          exists(
            db.select().from(screenshotsTable)
              .where(eq(screenshotsTable.reference_id, referencesTable.id))
          )
        );
      } else {
        conditions.push(
          sql`NOT EXISTS (
            SELECT 1 FROM ${screenshotsTable} 
            WHERE ${screenshotsTable.reference_id} = ${referencesTable.id}
          )`
        );
      }
    }

    // Build and execute query in one chain to avoid type conflicts
    const queryBuilder = db.select().from(referencesTable);
    
    const results = await (conditions.length > 0 
      ? queryBuilder
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(referencesTable.updated_at))
      : queryBuilder
          .orderBy(desc(referencesTable.updated_at))
    ).execute();

    // Convert results to match schema types
    return results.map(reference => ({
      ...reference,
      tags: reference.tags || [] // Ensure tags is always an array
    }));
  } catch (error) {
    console.error('Reference search failed:', error);
    throw error;
  }
}

export async function getAllTags(): Promise<string[]> {
  try {
    // Query all references and extract tags
    const references = await db.select({
      tags: referencesTable.tags
    }).from(referencesTable).execute();

    // Extract unique tags from all references
    const allTags = new Set<string>();
    
    for (const reference of references) {
      const tags = reference.tags || [];
      for (const tag of tags) {
        if (tag && tag.trim()) {
          allTags.add(tag.trim());
        }
      }
    }

    // Return sorted unique tags
    return Array.from(allTags).sort();
  } catch (error) {
    console.error('Failed to get all tags:', error);
    throw error;
  }
}