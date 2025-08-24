import { db } from '../db';
import { referencesTable, screenshotsTable } from '../db/schema';
import { type ReferenceWithScreenshots } from '../schema';
import { eq } from 'drizzle-orm';

export const getReferenceById = async (id: number): Promise<ReferenceWithScreenshots | null> => {
  try {
    // Query reference with associated screenshots using join
    const results = await db.select()
      .from(referencesTable)
      .leftJoin(screenshotsTable, eq(screenshotsTable.reference_id, referencesTable.id))
      .where(eq(referencesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Group screenshots by reference
    const reference = results[0].references;
    const screenshots = results
      .filter(result => result.screenshots !== null)
      .map(result => result.screenshots!);

    return {
      id: reference.id,
      title: reference.title,
      url: reference.url,
      description: reference.description,
      notes: reference.notes,
      tags: reference.tags,
      created_at: reference.created_at,
      updated_at: reference.updated_at,
      screenshots: screenshots
    };
  } catch (error) {
    console.error('Failed to get reference by id:', error);
    throw error;
  }
};