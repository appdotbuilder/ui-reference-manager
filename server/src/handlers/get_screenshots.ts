import { db } from '../db';
import { screenshotsTable } from '../db/schema';
import { type Screenshot } from '../schema';
import { desc, eq, isNull } from 'drizzle-orm';

export async function getScreenshots(): Promise<Screenshot[]> {
  try {
    const results = await db.select()
      .from(screenshotsTable)
      .orderBy(desc(screenshotsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch screenshots:', error);
    throw error;
  }
}

export async function getScreenshotsByReferenceId(referenceId: number): Promise<Screenshot[]> {
  try {
    const results = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.reference_id, referenceId))
      .orderBy(desc(screenshotsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch screenshots by reference ID:', error);
    throw error;
  }
}

export async function getIndependentScreenshots(): Promise<Screenshot[]> {
  try {
    const results = await db.select()
      .from(screenshotsTable)
      .where(isNull(screenshotsTable.reference_id))
      .orderBy(desc(screenshotsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch independent screenshots:', error);
    throw error;
  }
}