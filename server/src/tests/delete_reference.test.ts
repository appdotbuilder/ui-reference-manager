import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { referencesTable, screenshotsTable } from '../db/schema';
import { type CreateReferenceInput, type CreateScreenshotInput } from '../schema';
import { deleteReference } from '../handlers/delete_reference';
import { eq } from 'drizzle-orm';

// Test input for creating a reference
const testReferenceInput: CreateReferenceInput = {
  title: 'Test Reference',
  url: 'https://example.com',
  description: 'A reference for testing deletion',
  notes: 'Some test notes',
  tags: ['test', 'deletion']
};

// Test input for creating a screenshot
const testScreenshotInput: CreateScreenshotInput = {
  filename: 'test-screenshot.png',
  original_filename: 'original-screenshot.png',
  file_path: '/uploads/test-screenshot.png',
  file_size: 1024,
  mime_type: 'image/png',
  alt_text: 'Test screenshot'
};

describe('deleteReference', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a reference that exists', async () => {
    // Create a test reference
    const createResult = await db.insert(referencesTable)
      .values({
        title: testReferenceInput.title,
        url: testReferenceInput.url,
        description: testReferenceInput.description,
        notes: testReferenceInput.notes,
        tags: testReferenceInput.tags || []
      })
      .returning()
      .execute();

    const referenceId = createResult[0].id;

    // Delete the reference
    const result = await deleteReference(referenceId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify reference is deleted from database
    const references = await db.select()
      .from(referencesTable)
      .where(eq(referencesTable.id, referenceId))
      .execute();

    expect(references).toHaveLength(0);
  });

  it('should return false when deleting non-existent reference', async () => {
    // Try to delete a reference that doesn't exist
    const result = await deleteReference(99999);

    // Should return false indicating no deletion occurred
    expect(result).toBe(false);
  });

  it('should delete associated screenshots when deleting reference', async () => {
    // Create a test reference
    const createReferenceResult = await db.insert(referencesTable)
      .values({
        title: testReferenceInput.title,
        url: testReferenceInput.url,
        description: testReferenceInput.description,
        notes: testReferenceInput.notes,
        tags: testReferenceInput.tags || []
      })
      .returning()
      .execute();

    const referenceId = createReferenceResult[0].id;

    // Create associated screenshots
    const createScreenshotResult = await db.insert(screenshotsTable)
      .values([
        {
          ...testScreenshotInput,
          reference_id: referenceId,
          filename: 'screenshot1.png'
        },
        {
          ...testScreenshotInput,
          reference_id: referenceId,
          filename: 'screenshot2.png'
        }
      ])
      .returning()
      .execute();

    // Verify screenshots were created
    const screenshotsBefore = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.reference_id, referenceId))
      .execute();

    expect(screenshotsBefore).toHaveLength(2);

    // Delete the reference
    const result = await deleteReference(referenceId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify reference is deleted
    const references = await db.select()
      .from(referencesTable)
      .where(eq(referencesTable.id, referenceId))
      .execute();

    expect(references).toHaveLength(0);

    // Verify associated screenshots are also deleted
    const screenshotsAfter = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.reference_id, referenceId))
      .execute();

    expect(screenshotsAfter).toHaveLength(0);
  });

  it('should not affect screenshots with null reference_id', async () => {
    // Create a test reference
    const createReferenceResult = await db.insert(referencesTable)
      .values({
        title: testReferenceInput.title,
        url: testReferenceInput.url,
        description: testReferenceInput.description,
        notes: testReferenceInput.notes,
        tags: testReferenceInput.tags || []
      })
      .returning()
      .execute();

    const referenceId = createReferenceResult[0].id;

    // Create screenshot associated with reference
    await db.insert(screenshotsTable)
      .values({
        ...testScreenshotInput,
        reference_id: referenceId,
        filename: 'associated-screenshot.png'
      })
      .execute();

    // Create independent screenshot (null reference_id)
    const independentScreenshotResult = await db.insert(screenshotsTable)
      .values({
        ...testScreenshotInput,
        reference_id: null,
        filename: 'independent-screenshot.png'
      })
      .returning()
      .execute();

    // Delete the reference
    const result = await deleteReference(referenceId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify reference is deleted
    const references = await db.select()
      .from(referencesTable)
      .where(eq(referencesTable.id, referenceId))
      .execute();

    expect(references).toHaveLength(0);

    // Verify associated screenshot is deleted
    const associatedScreenshots = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.reference_id, referenceId))
      .execute();

    expect(associatedScreenshots).toHaveLength(0);

    // Verify independent screenshot still exists
    const independentScreenshots = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.id, independentScreenshotResult[0].id))
      .execute();

    expect(independentScreenshots).toHaveLength(1);
    expect(independentScreenshots[0].filename).toBe('independent-screenshot.png');
  });

  it('should handle deletion of reference with no associated screenshots', async () => {
    // Create a test reference
    const createResult = await db.insert(referencesTable)
      .values({
        title: testReferenceInput.title,
        url: testReferenceInput.url,
        description: testReferenceInput.description,
        notes: testReferenceInput.notes,
        tags: testReferenceInput.tags || []
      })
      .returning()
      .execute();

    const referenceId = createResult[0].id;

    // Verify no screenshots exist for this reference
    const screenshotsBefore = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.reference_id, referenceId))
      .execute();

    expect(screenshotsBefore).toHaveLength(0);

    // Delete the reference
    const result = await deleteReference(referenceId);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify reference is deleted
    const references = await db.select()
      .from(referencesTable)
      .where(eq(referencesTable.id, referenceId))
      .execute();

    expect(references).toHaveLength(0);
  });
});