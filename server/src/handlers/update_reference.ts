import { db } from '../db';
import { referencesTable } from '../db/schema';
import { type UpdateReferenceInput, type Reference } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function updateReference(input: UpdateReferenceInput): Promise<Reference> {
  try {
    // Build the update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: sql`NOW()` // Always update the timestamp
    };

    // Only include fields that are actually provided in the input
    if (input.title !== undefined) {
      updateData['title'] = input.title;
    }
    if (input.url !== undefined) {
      updateData['url'] = input.url;
    }
    if (input.description !== undefined) {
      updateData['description'] = input.description;
    }
    if (input.notes !== undefined) {
      updateData['notes'] = input.notes;
    }
    if (input.tags !== undefined) {
      updateData['tags'] = input.tags;
    }

    // Update the reference
    const result = await db.update(referencesTable)
      .set(updateData)
      .where(eq(referencesTable.id, input.id))
      .returning()
      .execute();

    // Check if reference was found and updated
    if (result.length === 0) {
      throw new Error(`Reference with ID ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Reference update failed:', error);
    throw error;
  }
}