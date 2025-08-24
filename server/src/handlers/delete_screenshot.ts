import { db } from '../db';
import { screenshotsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteScreenshot(id: number): Promise<boolean> {
  try {
    // Delete the screenshot record from the database
    const result = await db.delete(screenshotsTable)
      .where(eq(screenshotsTable.id, id))
      .returning()
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.length > 0;
  } catch (error) {
    console.error('Screenshot deletion failed:', error);
    throw error;
  }
}