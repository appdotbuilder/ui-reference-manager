import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { screenshotsTable, referencesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { deleteScreenshot } from '../handlers/delete_screenshot';
import type { CreateScreenshotInput } from '../schema';

// Test screenshot data
const testScreenshot: CreateScreenshotInput = {
  filename: 'test-screenshot.png',
  original_filename: 'Original Screenshot.png',
  file_path: '/uploads/screenshots/test-screenshot.png',
  file_size: 1024000,
  mime_type: 'image/png',
  alt_text: 'Test screenshot for UI reference'
};

const testScreenshotWithoutAltText: CreateScreenshotInput = {
  filename: 'minimal-screenshot.jpg',
  original_filename: 'minimal.jpg',
  file_path: '/uploads/screenshots/minimal-screenshot.jpg',
  file_size: 512000,
  mime_type: 'image/jpeg'
};

describe('deleteScreenshot', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing screenshot', async () => {
    // Create a test screenshot
    const insertResult = await db.insert(screenshotsTable)
      .values(testScreenshot)
      .returning()
      .execute();
    
    const screenshotId = insertResult[0].id;

    // Delete the screenshot
    const result = await deleteScreenshot(screenshotId);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify screenshot is deleted from database
    const screenshots = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.id, screenshotId))
      .execute();

    expect(screenshots).toHaveLength(0);
  });

  it('should return false for non-existent screenshot', async () => {
    const nonExistentId = 99999;

    const result = await deleteScreenshot(nonExistentId);

    // Should return false when no record is found
    expect(result).toBe(false);
  });

  it('should delete screenshot without affecting its reference', async () => {
    // First create a reference
    const referenceResult = await db.insert(referencesTable)
      .values({
        title: 'Test Reference',
        description: 'A reference for testing',
        tags: ['test']
      })
      .returning()
      .execute();
    
    const referenceId = referenceResult[0].id;

    // Create a screenshot associated with the reference
    const screenshotResult = await db.insert(screenshotsTable)
      .values({
        ...testScreenshot,
        reference_id: referenceId
      })
      .returning()
      .execute();
    
    const screenshotId = screenshotResult[0].id;

    // Delete the screenshot
    const deleteResult = await deleteScreenshot(screenshotId);

    expect(deleteResult).toBe(true);

    // Verify screenshot is deleted
    const screenshots = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.id, screenshotId))
      .execute();

    expect(screenshots).toHaveLength(0);

    // Verify reference still exists
    const references = await db.select()
      .from(referencesTable)
      .where(eq(referencesTable.id, referenceId))
      .execute();

    expect(references).toHaveLength(1);
    expect(references[0].title).toEqual('Test Reference');
  });

  it('should delete independent screenshot without reference', async () => {
    // Create a screenshot without reference association
    const screenshotResult = await db.insert(screenshotsTable)
      .values(testScreenshotWithoutAltText)
      .returning()
      .execute();
    
    const screenshotId = screenshotResult[0].id;

    // Delete the screenshot
    const result = await deleteScreenshot(screenshotId);

    expect(result).toBe(true);

    // Verify screenshot is deleted
    const screenshots = await db.select()
      .from(screenshotsTable)
      .where(eq(screenshotsTable.id, screenshotId))
      .execute();

    expect(screenshots).toHaveLength(0);
  });

  it('should handle deletion of multiple screenshots correctly', async () => {
    // Create two screenshots
    const screenshot1Result = await db.insert(screenshotsTable)
      .values(testScreenshot)
      .returning()
      .execute();
    
    const screenshot2Result = await db.insert(screenshotsTable)
      .values(testScreenshotWithoutAltText)
      .returning()
      .execute();
    
    const screenshot1Id = screenshot1Result[0].id;
    const screenshot2Id = screenshot2Result[0].id;

    // Delete first screenshot
    const delete1Result = await deleteScreenshot(screenshot1Id);
    expect(delete1Result).toBe(true);

    // Verify first is deleted, second still exists
    const remainingScreenshots = await db.select()
      .from(screenshotsTable)
      .execute();

    expect(remainingScreenshots).toHaveLength(1);
    expect(remainingScreenshots[0].id).toEqual(screenshot2Id);

    // Delete second screenshot
    const delete2Result = await deleteScreenshot(screenshot2Id);
    expect(delete2Result).toBe(true);

    // Verify both are deleted
    const allScreenshots = await db.select()
      .from(screenshotsTable)
      .execute();

    expect(allScreenshots).toHaveLength(0);
  });

  it('should return false when attempting to delete same screenshot twice', async () => {
    // Create a screenshot
    const insertResult = await db.insert(screenshotsTable)
      .values(testScreenshot)
      .returning()
      .execute();
    
    const screenshotId = insertResult[0].id;

    // First deletion should succeed
    const firstDelete = await deleteScreenshot(screenshotId);
    expect(firstDelete).toBe(true);

    // Second deletion should return false (no record found)
    const secondDelete = await deleteScreenshot(screenshotId);
    expect(secondDelete).toBe(false);
  });
});