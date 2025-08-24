import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { screenshotsTable, referencesTable } from '../db/schema';
import { type CreateScreenshotInput } from '../schema';
import { createScreenshot } from '../handlers/create_screenshot';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateScreenshotInput = {
  filename: 'screenshot_123.png',
  original_filename: 'my-ui-design.png',
  file_path: '/uploads/screenshots/screenshot_123.png',
  file_size: 2048576, // 2MB
  mime_type: 'image/png',
  alt_text: 'UI design mockup showing navigation layout'
};

// Test input without optional fields
const minimalTestInput: CreateScreenshotInput = {
  filename: 'minimal.jpg',
  original_filename: 'photo.jpg',
  file_path: '/uploads/minimal.jpg',
  file_size: 512000, // 512KB
  mime_type: 'image/jpeg'
};

describe('createScreenshot', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a screenshot without reference', async () => {
    const result = await createScreenshot(testInput);

    // Basic field validation
    expect(result.filename).toEqual('screenshot_123.png');
    expect(result.original_filename).toEqual('my-ui-design.png');
    expect(result.file_path).toEqual('/uploads/screenshots/screenshot_123.png');
    expect(result.file_size).toEqual(2048576);
    expect(result.mime_type).toEqual('image/png');
    expect(result.alt_text).toEqual('UI design mockup showing navigation layout');
    expect(result.reference_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a screenshot with minimal fields', async () => {
    const result = await createScreenshot(minimalTestInput);

    expect(result.filename).toEqual('minimal.jpg');
    expect(result.original_filename).toEqual('photo.jpg');
    expect(result.file_path).toEqual('/uploads/minimal.jpg');
    expect(result.file_size).toEqual(512000);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.alt_text).toBeNull();
    expect(result.reference_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save screenshot to database', async () => {
    const result = await createScreenshot(testInput);

    // Query using proper drizzle syntax
    const screenshots = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.id, result.id))
      .execute();

    expect(screenshots).toHaveLength(1);
    expect(screenshots[0].filename).toEqual('screenshot_123.png');
    expect(screenshots[0].original_filename).toEqual('my-ui-design.png');
    expect(screenshots[0].file_size).toEqual(2048576);
    expect(screenshots[0].reference_id).toBeNull();
    expect(screenshots[0].created_at).toBeInstanceOf(Date);
  });

  it('should create screenshot with valid reference_id', async () => {
    // Create a reference first
    const reference = await db.insert(referencesTable)
      .values({
        title: 'Test Reference',
        url: 'https://example.com',
        description: 'A test reference',
        tags: ['test', 'ui']
      })
      .returning()
      .execute();

    const inputWithReference: CreateScreenshotInput = {
      ...testInput,
      reference_id: reference[0].id
    };

    const result = await createScreenshot(inputWithReference);

    expect(result.reference_id).toEqual(reference[0].id);
    expect(result.filename).toEqual('screenshot_123.png');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should associate screenshot with reference in database', async () => {
    // Create a reference first
    const reference = await db.insert(referencesTable)
      .values({
        title: 'UI Reference',
        description: 'Reference for UI elements',
        tags: ['ui', 'design']
      })
      .returning()
      .execute();

    const inputWithReference: CreateScreenshotInput = {
      ...testInput,
      reference_id: reference[0].id
    };

    const result = await createScreenshot(inputWithReference);

    // Verify the association in database
    const screenshots = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.reference_id, reference[0].id))
      .execute();

    expect(screenshots).toHaveLength(1);
    expect(screenshots[0].id).toEqual(result.id);
    expect(screenshots[0].reference_id).toEqual(reference[0].id);
    expect(screenshots[0].filename).toEqual('screenshot_123.png');
  });

  it('should throw error for non-existent reference_id', async () => {
    const inputWithInvalidReference: CreateScreenshotInput = {
      ...testInput,
      reference_id: 99999 // Non-existent ID
    };

    await expect(createScreenshot(inputWithInvalidReference))
      .rejects.toThrow(/Reference with id 99999 does not exist/i);
  });

  it('should handle null reference_id explicitly', async () => {
    const inputWithNullReference: CreateScreenshotInput = {
      ...testInput,
      reference_id: null
    };

    const result = await createScreenshot(inputWithNullReference);

    expect(result.reference_id).toBeNull();
    expect(result.filename).toEqual('screenshot_123.png');
    expect(result.id).toBeDefined();
  });

  it('should handle undefined reference_id', async () => {
    const inputWithUndefinedReference: CreateScreenshotInput = {
      ...testInput,
      reference_id: undefined
    };

    const result = await createScreenshot(inputWithUndefinedReference);

    expect(result.reference_id).toBeNull();
    expect(result.filename).toEqual('screenshot_123.png');
    expect(result.id).toBeDefined();
  });

  it('should create multiple screenshots for same reference', async () => {
    // Create a reference first
    const reference = await db.insert(referencesTable)
      .values({
        title: 'Multi-screenshot Reference',
        tags: ['multi', 'test']
      })
      .returning()
      .execute();

    const screenshot1Input: CreateScreenshotInput = {
      ...testInput,
      filename: 'screenshot1.png',
      reference_id: reference[0].id
    };

    const screenshot2Input: CreateScreenshotInput = {
      ...minimalTestInput,
      filename: 'screenshot2.jpg',
      reference_id: reference[0].id
    };

    const result1 = await createScreenshot(screenshot1Input);
    const result2 = await createScreenshot(screenshot2Input);

    expect(result1.reference_id).toEqual(reference[0].id);
    expect(result2.reference_id).toEqual(reference[0].id);
    expect(result1.id).not.toEqual(result2.id);

    // Verify both screenshots exist in database
    const screenshots = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.reference_id, reference[0].id))
      .execute();

    expect(screenshots).toHaveLength(2);
    const filenames = screenshots.map(s => s.filename).sort();
    expect(filenames).toEqual(['screenshot1.png', 'screenshot2.jpg']);
  });
});