import { db } from '../db';
import { screenshotsTable, referencesTable } from '../db/schema';
import { type UpdateScreenshotInput, type Screenshot } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateScreenshot(input: UpdateScreenshotInput): Promise<Screenshot> {
  try {
    // Validate that reference exists if reference_id is provided
    if (input.reference_id !== undefined && input.reference_id !== null) {
      const referenceExists = await db.select()
        .from(referencesTable)
        .where(eq(referencesTable.id, input.reference_id))
        .execute();

      if (referenceExists.length === 0) {
        throw new Error(`Reference with id ${input.reference_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof screenshotsTable.$inferInsert> = {};
    
    if (input.reference_id !== undefined) {
      updateData.reference_id = input.reference_id;
    }
    
    if (input.alt_text !== undefined) {
      updateData.alt_text = input.alt_text;
    }

    // If no fields to update, just return the existing record
    if (Object.keys(updateData).length === 0) {
      const existingResult = await db.select()
        .from(screenshotsTable)
        .where(eq(screenshotsTable.id, input.id))
        .execute();
      
      if (existingResult.length === 0) {
        throw new Error(`Screenshot with id ${input.id} not found`);
      }
      
      return existingResult[0];
    }

    // Update screenshot record
    const result = await db.update(screenshotsTable)
      .set(updateData)
      .where(eq(screenshotsTable.id, input.id))
      .returning()
      .execute();

    // Check if screenshot was found and updated
    if (result.length === 0) {
      throw new Error(`Screenshot with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Screenshot update failed:', error);
    throw error;
  }
}