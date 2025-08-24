import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { screenshotsTable, referencesTable } from '../db/schema';
import { type UpdateScreenshotInput, type CreateReferenceInput } from '../schema';
import { updateScreenshot } from '../handlers/update_screenshot';
import { eq } from 'drizzle-orm';

// Test data for creating prerequisites
const testReference: CreateReferenceInput = {
  title: 'Test Reference',
  description: 'A test reference for screenshot updates',
  tags: ['test']
};

const testScreenshot = {
  filename: 'test-screenshot.jpg',
  original_filename: 'original-screenshot.jpg',
  file_path: '/test/path/screenshot.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  alt_text: 'Original alt text'
};

describe('updateScreenshot', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update screenshot alt_text only', async () => {
    // Create prerequisite screenshot
    const createdScreenshots = await db.insert(screenshotsTable)
      .values(testScreenshot)
      .returning()
      .execute();
    
    const screenshot = createdScreenshots[0];

    const updateInput: UpdateScreenshotInput = {
      id: screenshot.id,
      alt_text: 'Updated alt text'
    };

    const result = await updateScreenshot(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(screenshot.id);
    expect(result.alt_text).toEqual('Updated alt text');
    
    // Verify unchanged fields
    expect(result.reference_id).toEqual(screenshot.reference_id);
    expect(result.filename).toEqual(screenshot.filename);
    expect(result.original_filename).toEqual(screenshot.original_filename);
    expect(result.file_path).toEqual(screenshot.file_path);
    expect(result.file_size).toEqual(screenshot.file_size);
    expect(result.mime_type).toEqual(screenshot.mime_type);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update screenshot reference_id with valid reference', async () => {
    // Create prerequisite reference
    const createdReferences = await db.insert(referencesTable)
      .values({
        title: testReference.title,
        description: testReference.description,
        tags: testReference.tags || []
      })
      .returning()
      .execute();
    
    const reference = createdReferences[0];

    // Create screenshot without reference
    const createdScreenshots = await db.insert(screenshotsTable)
      .values({
        ...testScreenshot,
        reference_id: null
      })
      .returning()
      .execute();
    
    const screenshot = createdScreenshots[0];

    const updateInput: UpdateScreenshotInput = {
      id: screenshot.id,
      reference_id: reference.id
    };

    const result = await updateScreenshot(updateInput);

    // Verify updated reference_id
    expect(result.id).toEqual(screenshot.id);
    expect(result.reference_id).toEqual(reference.id);
    
    // Verify unchanged fields
    expect(result.alt_text).toEqual(screenshot.alt_text);
    expect(result.filename).toEqual(screenshot.filename);
  });

  it('should update both reference_id and alt_text', async () => {
    // Create prerequisite reference
    const createdReferences = await db.insert(referencesTable)
      .values({
        title: testReference.title,
        description: testReference.description,
        tags: testReference.tags || []
      })
      .returning()
      .execute();
    
    const reference = createdReferences[0];

    // Create screenshot
    const createdScreenshots = await db.insert(screenshotsTable)
      .values(testScreenshot)
      .returning()
      .execute();
    
    const screenshot = createdScreenshots[0];

    const updateInput: UpdateScreenshotInput = {
      id: screenshot.id,
      reference_id: reference.id,
      alt_text: 'Updated alt text with reference'
    };

    const result = await updateScreenshot(updateInput);

    // Verify both updated fields
    expect(result.id).toEqual(screenshot.id);
    expect(result.reference_id).toEqual(reference.id);
    expect(result.alt_text).toEqual('Updated alt text with reference');
    
    // Verify unchanged fields
    expect(result.filename).toEqual(screenshot.filename);
    expect(result.file_size).toEqual(screenshot.file_size);
  });

  it('should set reference_id to null when explicitly provided', async () => {
    // Create prerequisite reference
    const createdReferences = await db.insert(referencesTable)
      .values({
        title: testReference.title,
        description: testReference.description,
        tags: testReference.tags || []
      })
      .returning()
      .execute();
    
    const reference = createdReferences[0];

    // Create screenshot with reference
    const createdScreenshots = await db.insert(screenshotsTable)
      .values({
        ...testScreenshot,
        reference_id: reference.id
      })
      .returning()
      .execute();
    
    const screenshot = createdScreenshots[0];

    const updateInput: UpdateScreenshotInput = {
      id: screenshot.id,
      reference_id: null
    };

    const result = await updateScreenshot(updateInput);

    // Verify reference_id was set to null
    expect(result.id).toEqual(screenshot.id);
    expect(result.reference_id).toBeNull();
    
    // Verify unchanged fields
    expect(result.alt_text).toEqual(screenshot.alt_text);
    expect(result.filename).toEqual(screenshot.filename);
  });

  it('should save changes to database', async () => {
    // Create screenshot
    const createdScreenshots = await db.insert(screenshotsTable)
      .values(testScreenshot)
      .returning()
      .execute();
    
    const screenshot = createdScreenshots[0];

    const updateInput: UpdateScreenshotInput = {
      id: screenshot.id,
      alt_text: 'Verified in database'
    };

    await updateScreenshot(updateInput);

    // Query database directly to verify changes were persisted
    const screenshots = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.id, screenshot.id))
      .execute();

    expect(screenshots).toHaveLength(1);
    expect(screenshots[0].alt_text).toEqual('Verified in database');
    expect(screenshots[0].filename).toEqual(testScreenshot.filename);
  });

  it('should throw error when screenshot does not exist', async () => {
    const updateInput: UpdateScreenshotInput = {
      id: 99999,
      alt_text: 'Should fail'
    };

    await expect(updateScreenshot(updateInput)).rejects.toThrow(/Screenshot with id 99999 not found/i);
  });

  it('should throw error when reference_id does not exist', async () => {
    // Create screenshot
    const createdScreenshots = await db.insert(screenshotsTable)
      .values(testScreenshot)
      .returning()
      .execute();
    
    const screenshot = createdScreenshots[0];

    const updateInput: UpdateScreenshotInput = {
      id: screenshot.id,
      reference_id: 99999
    };

    await expect(updateScreenshot(updateInput)).rejects.toThrow(/Reference with id 99999 not found/i);
  });

  it('should handle update with no changes gracefully', async () => {
    // Create screenshot
    const createdScreenshots = await db.insert(screenshotsTable)
      .values(testScreenshot)
      .returning()
      .execute();
    
    const screenshot = createdScreenshots[0];

    // Update with only ID (no actual changes)
    const updateInput: UpdateScreenshotInput = {
      id: screenshot.id
    };

    const result = await updateScreenshot(updateInput);

    // Should return the original screenshot unchanged
    expect(result.id).toEqual(screenshot.id);
    expect(result.alt_text).toEqual(screenshot.alt_text);
    expect(result.reference_id).toEqual(screenshot.reference_id);
    expect(result.filename).toEqual(screenshot.filename);
  });
});