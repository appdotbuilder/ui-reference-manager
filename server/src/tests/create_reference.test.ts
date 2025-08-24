import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { referencesTable } from '../db/schema';
import { type CreateReferenceInput } from '../schema';
import { createReference } from '../handlers/create_reference';
import { eq } from 'drizzle-orm';

// Test input with all fields
const fullTestInput: CreateReferenceInput = {
  title: 'Complete UI Reference',
  url: 'https://example.com/ui-guide',
  description: 'A comprehensive UI reference guide',
  notes: 'Important notes about implementation',
  tags: ['ui', 'design', 'reference']
};

// Minimal test input
const minimalTestInput: CreateReferenceInput = {
  title: 'Minimal Reference',
  url: null,
  description: null,
  notes: null,
  tags: []
};

describe('createReference', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a reference with all fields', async () => {
    const result = await createReference(fullTestInput);

    // Basic field validation
    expect(result.title).toEqual('Complete UI Reference');
    expect(result.url).toEqual('https://example.com/ui-guide');
    expect(result.description).toEqual('A comprehensive UI reference guide');
    expect(result.notes).toEqual('Important notes about implementation');
    expect(result.tags).toEqual(['ui', 'design', 'reference']);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a minimal reference with only title', async () => {
    const result = await createReference(minimalTestInput);

    expect(result.title).toEqual('Minimal Reference');
    expect(result.url).toBeNull();
    expect(result.description).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save reference to database correctly', async () => {
    const result = await createReference(fullTestInput);

    // Query the database to verify the record was saved
    const references = await db.select()
      .from(referencesTable)
      .where(eq(referencesTable.id, result.id))
      .execute();

    expect(references).toHaveLength(1);
    const savedReference = references[0];
    
    expect(savedReference.title).toEqual('Complete UI Reference');
    expect(savedReference.url).toEqual('https://example.com/ui-guide');
    expect(savedReference.description).toEqual('A comprehensive UI reference guide');
    expect(savedReference.notes).toEqual('Important notes about implementation');
    expect(savedReference.tags).toEqual(['ui', 'design', 'reference']);
    expect(savedReference.created_at).toBeInstanceOf(Date);
    expect(savedReference.updated_at).toBeInstanceOf(Date);
  });

  it('should handle undefined optional fields correctly', async () => {
    const inputWithUndefined: CreateReferenceInput = {
      title: 'Reference with undefined fields',
      tags: [] // Include required field with default value
      // All other fields are undefined (not provided)
    };

    const result = await createReference(inputWithUndefined);

    expect(result.title).toEqual('Reference with undefined fields');
    expect(result.url).toBeNull();
    expect(result.description).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.tags).toEqual([]); // Should default to empty array
  });

  it('should handle empty tags array', async () => {
    const inputWithEmptyTags: CreateReferenceInput = {
      title: 'Reference with empty tags',
      url: 'https://example.com',
      description: 'Test description',
      notes: 'Test notes',
      tags: []
    };

    const result = await createReference(inputWithEmptyTags);

    expect(result.tags).toEqual([]);
    expect(Array.isArray(result.tags)).toBe(true);
  });

  it('should create multiple references with unique IDs', async () => {
    const input1: CreateReferenceInput = {
      title: 'First Reference',
      tags: ['tag1']
    };

    const input2: CreateReferenceInput = {
      title: 'Second Reference', 
      tags: ['tag2']
    };

    const result1 = await createReference(input1);
    const result2 = await createReference(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.title).toEqual('First Reference');
    expect(result2.title).toEqual('Second Reference');
    expect(result1.tags).toEqual(['tag1']);
    expect(result2.tags).toEqual(['tag2']);
  });

  it('should handle special characters in fields', async () => {
    const inputWithSpecialChars: CreateReferenceInput = {
      title: 'Reference with "quotes" & symbols!',
      url: 'https://example.com/path?param=value&other=123',
      description: 'Description with émojis 🎨 and newlines\nSecond line',
      notes: 'Notes with <HTML> tags and JSON {"key": "value"}',
      tags: ['special-chars', 'émoji-🎨', 'json/data']
    };

    const result = await createReference(inputWithSpecialChars);

    expect(result.title).toEqual('Reference with "quotes" & symbols!');
    expect(result.url).toEqual('https://example.com/path?param=value&other=123');
    expect(result.description).toEqual('Description with émojis 🎨 and newlines\nSecond line');
    expect(result.notes).toEqual('Notes with <HTML> tags and JSON {"key": "value"}');
    expect(result.tags).toEqual(['special-chars', 'émoji-🎨', 'json/data']);
  });
});