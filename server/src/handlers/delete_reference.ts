import { db } from '../db';
import { referencesTable, screenshotsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteReference(id: number): Promise<boolean> {
  try {
    // First, delete associated screenshots
    await db.delete(screenshotsTable)
      .where(eq(screenshotsTable.reference_id, id))
      .execute();

    // Then delete the reference itself
    const result = await db.delete(referencesTable)
      .where(eq(referencesTable.id, id))
      .returning()
      .execute();

    // Return true if a reference was actually deleted, false if not found
    return result.length > 0;
  } catch (error) {
    console.error('Reference deletion failed:', error);
    throw error;
  }
}