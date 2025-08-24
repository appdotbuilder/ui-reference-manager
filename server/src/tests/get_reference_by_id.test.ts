import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { referencesTable, screenshotsTable } from '../db/schema';
import { type CreateReferenceInput, type CreateScreenshotInput } from '../schema';
import { getReferenceById } from '../handlers/get_reference_by_id';

describe('getReferenceById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return reference with screenshots', async () => {
    // Create a reference
    const referenceInput = {
      title: 'Test Reference',
      url: 'https://example.com',
      description: 'A test reference',
      notes: 'Some notes',
      tags: ['tag1', 'tag2']
    };

    const referenceResult = await db.insert(referencesTable)
      .values(referenceInput)
      .returning()
      .execute();

    const referenceId = referenceResult[0].id;

    // Create associated screenshots
    const screenshotInput1 = {
      reference_id: referenceId,
      filename: 'test1.png',
      original_filename: 'original1.png',
      file_path: '/path/to/test1.png',
      file_size: 1024,
      mime_type: 'image/png',
      alt_text: 'Test image 1'
    };

    const screenshotInput2 = {
      reference_id: referenceId,
      filename: 'test2.jpg',
      original_filename: 'original2.jpg',
      file_path: '/path/to/test2.jpg',
      file_size: 2048,
      mime_type: 'image/jpeg',
      alt_text: 'Test image 2'
    };

    await db.insert(screenshotsTable)
      .values([screenshotInput1, screenshotInput2])
      .execute();

    // Test the handler
    const result = await getReferenceById(referenceId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(referenceId);
    expect(result!.title).toBe('Test Reference');
    expect(result!.url).toBe('https://example.com');
    expect(result!.description).toBe('A test reference');
    expect(result!.notes).toBe('Some notes');
    expect(result!.tags).toEqual(['tag1', 'tag2']);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.screenshots).toHaveLength(2);

    // Verify screenshots
    const screenshot1 = result!.screenshots.find(s => s.filename === 'test1.png');
    expect(screenshot1).toBeDefined();
    expect(screenshot1!.reference_id).toBe(referenceId);
    expect(screenshot1!.original_filename).toBe('original1.png');
    expect(screenshot1!.file_path).toBe('/path/to/test1.png');
    expect(screenshot1!.file_size).toBe(1024);
    expect(screenshot1!.mime_type).toBe('image/png');
    expect(screenshot1!.alt_text).toBe('Test image 1');

    const screenshot2 = result!.screenshots.find(s => s.filename === 'test2.jpg');
    expect(screenshot2).toBeDefined();
    expect(screenshot2!.reference_id).toBe(referenceId);
    expect(screenshot2!.original_filename).toBe('original2.jpg');
    expect(screenshot2!.file_path).toBe('/path/to/test2.jpg');
    expect(screenshot2!.file_size).toBe(2048);
    expect(screenshot2!.mime_type).toBe('image/jpeg');
    expect(screenshot2!.alt_text).toBe('Test image 2');
  });

  it('should return reference without screenshots', async () => {
    // Create a reference without screenshots
    const referenceInput = {
      title: 'Reference Without Screenshots',
      url: null,
      description: null,
      notes: null,
      tags: []
    };

    const referenceResult = await db.insert(referencesTable)
      .values(referenceInput)
      .returning()
      .execute();

    const referenceId = referenceResult[0].id;

    // Test the handler
    const result = await getReferenceById(referenceId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(referenceId);
    expect(result!.title).toBe('Reference Without Screenshots');
    expect(result!.url).toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.tags).toEqual([]);
    expect(result!.screenshots).toHaveLength(0);
  });

  it('should return null for non-existent reference', async () => {
    const result = await getReferenceById(999);
    expect(result).toBeNull();
  });

  it('should handle reference with nullable fields correctly', async () => {
    // Create a reference with mixed null and non-null fields
    const referenceInput = {
      title: 'Minimal Reference',
      url: null,
      description: 'Has description',
      notes: null,
      tags: ['single-tag']
    };

    const referenceResult = await db.insert(referencesTable)
      .values(referenceInput)
      .returning()
      .execute();

    const referenceId = referenceResult[0].id;

    // Add one screenshot with nullable alt_text
    const screenshotInput = {
      reference_id: referenceId,
      filename: 'minimal.png',
      original_filename: 'minimal_original.png',
      file_path: '/path/to/minimal.png',
      file_size: 512,
      mime_type: 'image/png',
      alt_text: null
    };

    await db.insert(screenshotsTable)
      .values(screenshotInput)
      .execute();

    // Test the handler
    const result = await getReferenceById(referenceId);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Minimal Reference');
    expect(result!.url).toBeNull();
    expect(result!.description).toBe('Has description');
    expect(result!.notes).toBeNull();
    expect(result!.tags).toEqual(['single-tag']);
    expect(result!.screenshots).toHaveLength(1);
    expect(result!.screenshots[0].alt_text).toBeNull();
  });

  it('should preserve date types correctly', async () => {
    // Create a reference
    const referenceInput = {
      title: 'Date Test Reference',
      url: 'https://example.com',
      description: null,
      notes: null,
      tags: []
    };

    const referenceResult = await db.insert(referencesTable)
      .values(referenceInput)
      .returning()
      .execute();

    const referenceId = referenceResult[0].id;

    // Test the handler
    const result = await getReferenceById(referenceId);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(typeof result!.created_at.getTime()).toBe('number');
    expect(typeof result!.updated_at.getTime()).toBe('number');
  });
});