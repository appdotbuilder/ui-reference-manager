import { db } from '../db';
import { referencesTable } from '../db/schema';
import { type CreateReferenceInput, type Reference } from '../schema';

export const createReference = async (input: CreateReferenceInput): Promise<Reference> => {
  try {
    // Insert reference record
    const result = await db.insert(referencesTable)
      .values({
        title: input.title,
        url: input.url || null,
        description: input.description || null,
        notes: input.notes || null,
        tags: input.tags || []
      })
      .returning()
      .execute();

    // Return the created reference
    const reference = result[0];
    return reference;
  } catch (error) {
    console.error('Reference creation failed:', error);
    throw error;
  }
};