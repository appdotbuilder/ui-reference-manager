import { db } from '../db';
import { referencesTable } from '../db/schema';
import { type Reference } from '../schema';
import { desc } from 'drizzle-orm';

export const getReferences = async (): Promise<Reference[]> => {
  try {
    // Query all references ordered by updated_at DESC
    const results = await db.select()
      .from(referencesTable)
      .orderBy(desc(referencesTable.updated_at))
      .execute();

    // Return the results - no conversion needed as all fields are already correct types
    return results;
  } catch (error) {
    console.error('Failed to get references:', error);
    throw error;
  }
};