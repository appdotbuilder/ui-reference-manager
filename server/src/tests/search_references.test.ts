import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { referencesTable, screenshotsTable } from '../db/schema';
import { type SearchReferencesInput, type CreateReferenceInput, type CreateScreenshotInput } from '../schema';
import { searchReferences, getAllTags } from '../handlers/search_references';
import { eq } from 'drizzle-orm';

// Test data
const testReferences: CreateReferenceInput[] = [
  {
    title: 'React Documentation',
    url: 'https://react.dev',
    description: 'Official React documentation and guides',
    notes: 'Great resource for learning React hooks',
    tags: ['react', 'javascript', 'frontend']
  },
  {
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/',
    description: 'Complete guide to TypeScript',
    notes: 'Essential for type-safe development',
    tags: ['typescript', 'javascript']
  },
  {
    title: 'Design System Notes',
    url: null,
    description: 'Internal design system guidelines',
    notes: 'Color schemes and component patterns',
    tags: ['design', 'ui', 'components']
  },
  {
    title: 'API Reference',
    url: 'https://api.example.com/docs',
    description: 'REST API documentation',
    notes: null,
    tags: ['api', 'backend']
  }
];

const testScreenshots: CreateScreenshotInput[] = [
  {
    reference_id: 1, // Will be set dynamically
    filename: 'react-docs.png',
    original_filename: 'react-documentation.png',
    file_path: '/uploads/react-docs.png',
    file_size: 245760,
    mime_type: 'image/png',
    alt_text: 'React documentation homepage'
  },
  {
    reference_id: 2, // Will be set dynamically
    filename: 'typescript-handbook.png',
    original_filename: 'typescript-handbook.png',
    file_path: '/uploads/typescript-handbook.png',
    file_size: 156832,
    mime_type: 'image/png',
    alt_text: 'TypeScript handbook page'
  }
];

describe('searchReferences', () => {
  let referenceIds: number[] = [];

  beforeEach(async () => {
    await createDB();
    
    // Create test references
    referenceIds = [];
    for (const refData of testReferences) {
      const result = await db.insert(referencesTable)
        .values({
          title: refData.title,
          url: refData.url,
          description: refData.description,
          notes: refData.notes,
          tags: refData.tags || []
        })
        .returning({ id: referencesTable.id })
        .execute();
      referenceIds.push(result[0].id);
    }

    // Create test screenshots for first two references
    for (let i = 0; i < 2; i++) {
      await db.insert(screenshotsTable)
        .values({
          reference_id: referenceIds[i],
          filename: testScreenshots[i].filename,
          original_filename: testScreenshots[i].original_filename,
          file_path: testScreenshots[i].file_path,
          file_size: testScreenshots[i].file_size,
          mime_type: testScreenshots[i].mime_type,
          alt_text: testScreenshots[i].alt_text
        })
        .execute();
    }
  });

  afterEach(resetDB);

  it('should return all references when no filters applied', async () => {
    const input: SearchReferencesInput = {};
    const results = await searchReferences(input);

    expect(results).toHaveLength(4);
    expect(results[0].title).toBeDefined();
    expect(Array.isArray(results[0].tags)).toBe(true);
  });

  it('should search by text query in title', async () => {
    const input: SearchReferencesInput = {
      query: 'React'
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('React Documentation');
  });

  it('should search by text query in description', async () => {
    const input: SearchReferencesInput = {
      query: 'Complete guide'
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('TypeScript Handbook');
  });

  it('should search by text query in notes', async () => {
    const input: SearchReferencesInput = {
      query: 'Color schemes'
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Design System Notes');
  });

  it('should perform case-insensitive text search', async () => {
    const input: SearchReferencesInput = {
      query: 'REACT'
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('React Documentation');
  });

  it('should filter by single tag', async () => {
    const input: SearchReferencesInput = {
      tags: ['typescript']
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('TypeScript Handbook');
    expect(results[0].tags).toContain('typescript');
  });

  it('should filter by multiple tags (AND logic)', async () => {
    const input: SearchReferencesInput = {
      tags: ['react', 'javascript']
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('React Documentation');
    expect(results[0].tags).toContain('react');
    expect(results[0].tags).toContain('javascript');
  });

  it('should return empty results for non-matching tags', async () => {
    const input: SearchReferencesInput = {
      tags: ['nonexistent']
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(0);
  });

  it('should filter references with URLs', async () => {
    const input: SearchReferencesInput = {
      has_url: true
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(3);
    results.forEach(ref => {
      expect(ref.url).not.toBeNull();
      expect(ref.url).not.toEqual('');
    });
  });

  it('should filter references without URLs', async () => {
    const input: SearchReferencesInput = {
      has_url: false
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Design System Notes');
    expect(results[0].url).toBeNull();
  });

  it('should filter references with screenshots', async () => {
    const input: SearchReferencesInput = {
      has_screenshots: true
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('React Documentation');
    expect(titles).toContain('TypeScript Handbook');
  });

  it('should filter references without screenshots', async () => {
    const input: SearchReferencesInput = {
      has_screenshots: false
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(2);
    const titles = results.map(r => r.title);
    expect(titles).toContain('Design System Notes');
    expect(titles).toContain('API Reference');
  });

  it('should combine multiple filters with AND logic', async () => {
    const input: SearchReferencesInput = {
      query: 'documentation',
      has_url: true,
      has_screenshots: true
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('React Documentation');
    expect(results[0].url).not.toBeNull();
  });

  it('should return results ordered by updated_at descending', async () => {
    // Update one reference to change its updated_at
    await db.update(referencesTable)
      .set({ 
        title: 'Updated React Documentation',
        updated_at: new Date()
      })
      .where(eq(referencesTable.id, referenceIds[0]))
      .execute();

    const input: SearchReferencesInput = {};
    const results = await searchReferences(input);

    expect(results).toHaveLength(4);
    expect(results[0].title).toEqual('Updated React Documentation');
    // Verify ordering by checking updated_at timestamps
    for (let i = 1; i < results.length; i++) {
      expect(results[i-1].updated_at >= results[i].updated_at).toBe(true);
    }
  });

  it('should handle empty query string', async () => {
    const input: SearchReferencesInput = {
      query: ''
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(4);
  });

  it('should handle empty tags array', async () => {
    const input: SearchReferencesInput = {
      tags: []
    };
    const results = await searchReferences(input);

    expect(results).toHaveLength(4);
  });
});

describe('getAllTags', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test references with various tags
    for (const refData of testReferences) {
      await db.insert(referencesTable)
        .values({
          title: refData.title,
          url: refData.url,
          description: refData.description,
          notes: refData.notes,
          tags: refData.tags || []
        })
        .execute();
    }
  });

  afterEach(resetDB);

  it('should return all unique tags', async () => {
    const tags = await getAllTags();

    const expectedTags = ['api', 'backend', 'components', 'design', 'frontend', 'javascript', 'react', 'typescript', 'ui'];
    expect(tags).toEqual(expectedTags);
  });

  it('should return sorted tags', async () => {
    const tags = await getAllTags();

    const sortedTags = [...tags].sort();
    expect(tags).toEqual(sortedTags);
  });

  it('should handle references with no tags', async () => {
    // Add a reference with no tags
    await db.insert(referencesTable)
      .values({
        title: 'No Tags Reference',
        url: null,
        description: null,
        notes: null,
        tags: []
      })
      .execute();

    const tags = await getAllTags();

    expect(tags.length).toBeGreaterThan(0);
    expect(Array.isArray(tags)).toBe(true);
  });

  it('should return empty array when no references exist', async () => {
    // Clear all references
    await db.delete(referencesTable).execute();

    const tags = await getAllTags();

    expect(tags).toEqual([]);
  });

  it('should handle duplicate tags across references', async () => {
    // Add another reference with overlapping tags
    await db.insert(referencesTable)
      .values({
        title: 'Another React Resource',
        url: 'https://react.example.com',
        description: 'Another React guide',
        notes: null,
        tags: ['react', 'javascript', 'tutorial'] // Overlapping with existing
      })
      .execute();

    const tags = await getAllTags();

    // Should still have unique tags only
    const uniqueTags = [...new Set(tags)];
    expect(tags.length).toEqual(uniqueTags.length);
    expect(tags).toContain('tutorial'); // New tag should be included
  });
});