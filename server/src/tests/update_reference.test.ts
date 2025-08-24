import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { referencesTable } from '../db/schema';
import { type UpdateReferenceInput, type CreateReferenceInput } from '../schema';
import { updateReference } from '../handlers/update_reference';
import { eq } from 'drizzle-orm';

// Helper function to create a test reference
async function createTestReference(): Promise<number> {
  const testInput: CreateReferenceInput = {
    title: 'Original Title',
    url: 'https://example.com',
    description: 'Original description',
    notes: 'Original notes',
    tags: ['tag1', 'tag2']
  };

  const result = await db.insert(referencesTable)
    .values({
      title: testInput.title,
      url: testInput.url,
      description: testInput.description,
      notes: testInput.notes,
      tags: testInput.tags
    })
    .returning()
    .execute();

  return result[0].id;
}

describe('updateReference', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a reference', async () => {
    const referenceId = await createTestReference();
    
    const updateInput: UpdateReferenceInput = {
      id: referenceId,
      title: 'Updated Title',
      url: 'https://updated.com',
      description: 'Updated description',
      notes: 'Updated notes',
      tags: ['newTag1', 'newTag2', 'newTag3']
    };

    const result = await updateReference(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(referenceId);
    expect(result.title).toEqual('Updated Title');
    expect(result.url).toEqual('https://updated.com');
    expect(result.description).toEqual('Updated description');
    expect(result.notes).toEqual('Updated notes');
    expect(result.tags).toEqual(['newTag1', 'newTag2', 'newTag3']);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    const referenceId = await createTestReference();
    
    // Get original reference to compare
    const originalRef = await db.select()
      .from(referencesTable)
      .where(eq(referencesTable.id, referenceId))
      .execute();

    const updateInput: UpdateReferenceInput = {
      id: referenceId,
      title: 'Partial Update Title'
    };

    const result = await updateReference(updateInput);

    // Verify only title was updated, other fields remain the same
    expect(result.id).toEqual(referenceId);
    expect(result.title).toEqual('Partial Update Title');
    expect(result.url).toEqual(originalRef[0].url);
    expect(result.description).toEqual(originalRef[0].description);
    expect(result.notes).toEqual(originalRef[0].notes);
    expect(result.tags).toEqual(originalRef[0].tags);
    expect(result.updated_at).toBeInstanceOf(Date);
    // updated_at should be different from original
    expect(result.updated_at.getTime()).toBeGreaterThan(originalRef[0].updated_at.getTime());
  });

  it('should update nullable fields to null', async () => {
    const referenceId = await createTestReference();
    
    const updateInput: UpdateReferenceInput = {
      id: referenceId,
      url: null,
      description: null,
      notes: null
    };

    const result = await updateReference(updateInput);

    // Verify nullable fields were set to null
    expect(result.id).toEqual(referenceId);
    expect(result.url).toBeNull();
    expect(result.description).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
    expect(result.tags).toEqual(['tag1', 'tag2']); // Should remain unchanged
  });

  it('should update tags to empty array', async () => {
    const referenceId = await createTestReference();
    
    const updateInput: UpdateReferenceInput = {
      id: referenceId,
      tags: []
    };

    const result = await updateReference(updateInput);

    // Verify tags were cleared
    expect(result.id).toEqual(referenceId);
    expect(result.tags).toEqual([]);
    expect(result.title).toEqual('Original Title'); // Should remain unchanged
  });

  it('should save updated reference to database', async () => {
    const referenceId = await createTestReference();
    
    const updateInput: UpdateReferenceInput = {
      id: referenceId,
      title: 'Database Update Test',
      url: 'https://dbtest.com',
      tags: ['db', 'test']
    };

    await updateReference(updateInput);

    // Verify changes were persisted to database
    const dbReference = await db.select()
      .from(referencesTable)
      .where(eq(referencesTable.id, referenceId))
      .execute();

    expect(dbReference).toHaveLength(1);
    expect(dbReference[0].title).toEqual('Database Update Test');
    expect(dbReference[0].url).toEqual('https://dbtest.com');
    expect(dbReference[0].tags).toEqual(['db', 'test']);
    expect(dbReference[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when reference does not exist', async () => {
    const updateInput: UpdateReferenceInput = {
      id: 99999, // Non-existent ID
      title: 'Non-existent Reference'
    };

    await expect(updateReference(updateInput)).rejects.toThrow(/Reference with ID 99999 not found/i);
  });

  it('should update reference with complex tags array', async () => {
    const referenceId = await createTestReference();
    
    const complexTags = ['ui', 'design-system', 'react', 'typescript', 'accessibility'];
    const updateInput: UpdateReferenceInput = {
      id: referenceId,
      tags: complexTags
    };

    const result = await updateReference(updateInput);

    expect(result.tags).toEqual(complexTags);
    expect(result.tags).toHaveLength(5);
    
    // Verify in database
    const dbReference = await db.select()
      .from(referencesTable)
      .where(eq(referencesTable.id, referenceId))
      .execute();

    expect(dbReference[0].tags).toEqual(complexTags);
  });

  it('should handle multiple sequential updates correctly', async () => {
    const referenceId = await createTestReference();
    
    // First update
    const firstUpdate: UpdateReferenceInput = {
      id: referenceId,
      title: 'First Update'
    };

    const firstResult = await updateReference(firstUpdate);
    expect(firstResult.title).toEqual('First Update');

    // Second update
    const secondUpdate: UpdateReferenceInput = {
      id: referenceId,
      title: 'Second Update',
      url: 'https://second.com'
    };

    const secondResult = await updateReference(secondUpdate);
    expect(secondResult.title).toEqual('Second Update');
    expect(secondResult.url).toEqual('https://second.com');
    
    // Verify updated_at was updated both times
    expect(secondResult.updated_at.getTime()).toBeGreaterThan(firstResult.updated_at.getTime());
  });
});