import { db } from '../db';
import { screenshotsTable, referencesTable } from '../db/schema';
import { type CreateScreenshotInput, type Screenshot } from '../schema';
import { eq } from 'drizzle-orm';

export const createScreenshot = async (input: CreateScreenshotInput): Promise<Screenshot> => {
  try {
    // Validate reference_id exists if provided
    if (input.reference_id !== undefined && input.reference_id !== null) {
      const existingReference = await db.select()
        .from(referencesTable)
        .where(eq(referencesTable.id, input.reference_id))
        .execute();

      if (existingReference.length === 0) {
        throw new Error(`Reference with id ${input.reference_id} does not exist`);
      }
    }

    // Insert screenshot record
    const result = await db.insert(screenshotsTable)
      .values({
        reference_id: input.reference_id ?? null,
        filename: input.filename,
        original_filename: input.original_filename,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        alt_text: input.alt_text ?? null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Screenshot creation failed:', error);
    throw error;
  }
};