import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { referencesTable } from '../db/schema';
import { type CreateReferenceInput } from '../schema';
import { getReferences } from '../handlers/get_references';

// Test reference inputs
const testReference1: CreateReferenceInput = {
  title: 'First Reference',
  url: 'https://example.com/first',
  description: 'First test reference',
  notes: 'Some notes for first reference',
  tags: ['tag1', 'tag2']
};

const testReference2: CreateReferenceInput = {
  title: 'Second Reference',
  url: 'https://example.com/second',
  description: 'Second test reference',
  notes: 'Some notes for second reference',
  tags: ['tag2', 'tag3']
};

const testReference3: CreateReferenceInput = {
  title: 'Third Reference Without URL',
  description: 'Reference without URL',
  notes: null,
  tags: ['tag1']
};

describe('getReferences', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no references exist', async () => {
    const result = await getReferences();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all references ordered by updated_at DESC', async () => {
    // Create test references with slight delays to ensure different timestamps
    const ref1 = await db.insert(referencesTable)
      .values({
        title: testReference1.title,
        url: testReference1.url,
        description: testReference1.description,
        notes: testReference1.notes,
        tags: testReference1.tags
      })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    const ref2 = await db.insert(referencesTable)
      .values({
        title: testReference2.title,
        url: testReference2.url,
        description: testReference2.description,
        notes: testReference2.notes,
        tags: testReference2.tags
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const ref3 = await db.insert(referencesTable)
      .values({
        title: testReference3.title,
        url: testReference3.url || null,
        description: testReference3.description,
        notes: testReference3.notes,
        tags: testReference3.tags
      })
      .returning()
      .execute();

    const result = await getReferences();

    // Should return all 3 references
    expect(result).toHaveLength(3);
    
    // Should be ordered by updated_at DESC (most recent first)
    expect(result[0].id).toEqual(ref3[0].id); // Most recent
    expect(result[1].id).toEqual(ref2[0].id); // Middle
    expect(result[2].id).toEqual(ref1[0].id); // Oldest
    
    // Verify all fields are present and correct
    expect(result[0].title).toEqual('Third Reference Without URL');
    expect(result[0].url).toBeNull();
    expect(result[0].description).toEqual('Reference without URL');
    expect(result[0].notes).toBeNull();
    expect(result[0].tags).toEqual(['tag1']);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    
    expect(result[1].title).toEqual('Second Reference');
    expect(result[1].url).toEqual('https://example.com/second');
    expect(result[1].tags).toEqual(['tag2', 'tag3']);
    
    expect(result[2].title).toEqual('First Reference');
    expect(result[2].url).toEqual('https://example.com/first');
    expect(result[2].tags).toEqual(['tag1', 'tag2']);
  });

  it('should handle references with null values correctly', async () => {
    // Create reference with all nullable fields as null
    await db.insert(referencesTable)
      .values({
        title: 'Reference with nulls',
        url: null,
        description: null,
        notes: null,
        tags: []
      })
      .returning()
      .execute();

    const result = await getReferences();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Reference with nulls');
    expect(result[0].url).toBeNull();
    expect(result[0].description).toBeNull();
    expect(result[0].notes).toBeNull();
    expect(result[0].tags).toEqual([]);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle large number of references', async () => {
    // Create multiple references
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        db.insert(referencesTable)
          .values({
            title: `Reference ${i}`,
            url: `https://example.com/${i}`,
            description: `Description ${i}`,
            notes: `Notes ${i}`,
            tags: [`tag${i}`]
          })
          .execute()
      );
    }

    await Promise.all(promises);

    const result = await getReferences();

    expect(result).toHaveLength(10);
    
    // Verify all references have required fields
    result.forEach((ref, index) => {
      expect(ref.id).toBeDefined();
      expect(ref.title).toContain('Reference');
      expect(ref.url).toContain('example.com');
      expect(ref.description).toContain('Description');
      expect(ref.notes).toContain('Notes');
      expect(Array.isArray(ref.tags)).toBe(true);
      expect(ref.created_at).toBeInstanceOf(Date);
      expect(ref.updated_at).toBeInstanceOf(Date);
    });
  });
});