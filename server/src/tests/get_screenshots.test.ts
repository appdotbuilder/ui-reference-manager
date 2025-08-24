import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { screenshotsTable, referencesTable } from '../db/schema';
import { type CreateScreenshotInput } from '../schema';
import { getScreenshots, getScreenshotsByReferenceId, getIndependentScreenshots } from '../handlers/get_screenshots';

// Test screenshot data
const testScreenshot: CreateScreenshotInput = {
  filename: 'test-screenshot.png',
  original_filename: 'original-test.png',
  file_path: '/uploads/test-screenshot.png',
  file_size: 1024,
  mime_type: 'image/png',
  alt_text: 'Test screenshot'
};

const testScreenshot2: CreateScreenshotInput = {
  filename: 'another-screenshot.jpg',
  original_filename: 'another-original.jpg',
  file_path: '/uploads/another-screenshot.jpg',
  file_size: 2048,
  mime_type: 'image/jpeg',
  alt_text: 'Another test screenshot'
};

const independentScreenshot: CreateScreenshotInput = {
  filename: 'independent.png',
  original_filename: 'independent-original.png',
  file_path: '/uploads/independent.png',
  file_size: 512,
  mime_type: 'image/png',
  alt_text: 'Independent screenshot'
};

describe('getScreenshots', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all screenshots ordered by created_at desc', async () => {
    // Create a reference first
    const referenceResult = await db.insert(referencesTable)
      .values({
        title: 'Test Reference',
        tags: ['test']
      })
      .returning()
      .execute();
    
    const referenceId = referenceResult[0].id;

    // Create screenshots with different timestamps
    const firstScreenshot = await db.insert(screenshotsTable)
      .values({
        ...testScreenshot,
        reference_id: referenceId
      })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondScreenshot = await db.insert(screenshotsTable)
      .values({
        ...testScreenshot2,
        reference_id: referenceId
      })
      .returning()
      .execute();

    // Create an independent screenshot
    await db.insert(screenshotsTable)
      .values(independentScreenshot)
      .returning()
      .execute();

    const result = await getScreenshots();

    expect(result).toHaveLength(3);
    
    // Verify basic field types and content
    result.forEach(screenshot => {
      expect(screenshot.id).toBeDefined();
      expect(typeof screenshot.filename).toBe('string');
      expect(typeof screenshot.original_filename).toBe('string');
      expect(typeof screenshot.file_path).toBe('string');
      expect(typeof screenshot.file_size).toBe('number');
      expect(typeof screenshot.mime_type).toBe('string');
      expect(screenshot.created_at).toBeInstanceOf(Date);
    });

    // Verify ordering by created_at DESC (most recent first)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });

  it('should return empty array when no screenshots exist', async () => {
    const result = await getScreenshots();
    expect(result).toHaveLength(0);
  });
});

describe('getScreenshotsByReferenceId', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return screenshots for specific reference ID', async () => {
    // Create references
    const reference1Result = await db.insert(referencesTable)
      .values({
        title: 'Reference 1',
        tags: ['test1']
      })
      .returning()
      .execute();

    const reference2Result = await db.insert(referencesTable)
      .values({
        title: 'Reference 2',
        tags: ['test2']
      })
      .returning()
      .execute();

    const reference1Id = reference1Result[0].id;
    const reference2Id = reference2Result[0].id;

    // Create screenshots for reference 1
    await db.insert(screenshotsTable)
      .values({
        ...testScreenshot,
        reference_id: reference1Id
      })
      .returning()
      .execute();

    await db.insert(screenshotsTable)
      .values({
        ...testScreenshot2,
        reference_id: reference1Id
      })
      .returning()
      .execute();

    // Create screenshot for reference 2
    await db.insert(screenshotsTable)
      .values({
        ...independentScreenshot,
        reference_id: reference2Id
      })
      .returning()
      .execute();

    // Create independent screenshot
    await db.insert(screenshotsTable)
      .values({
        filename: 'independent2.png',
        original_filename: 'independent2-original.png',
        file_path: '/uploads/independent2.png',
        file_size: 256,
        mime_type: 'image/png',
        alt_text: null
      })
      .returning()
      .execute();

    const result = await getScreenshotsByReferenceId(reference1Id);

    expect(result).toHaveLength(2);
    
    // Verify all screenshots belong to reference 1
    result.forEach(screenshot => {
      expect(screenshot.reference_id).toBe(reference1Id);
      expect(screenshot.id).toBeDefined();
      expect(screenshot.created_at).toBeInstanceOf(Date);
    });

    // Test with reference 2
    const result2 = await getScreenshotsByReferenceId(reference2Id);
    expect(result2).toHaveLength(1);
    expect(result2[0].reference_id).toBe(reference2Id);
  });

  it('should return empty array for reference with no screenshots', async () => {
    // Create a reference
    const referenceResult = await db.insert(referencesTable)
      .values({
        title: 'Empty Reference',
        tags: []
      })
      .returning()
      .execute();

    const referenceId = referenceResult[0].id;

    const result = await getScreenshotsByReferenceId(referenceId);
    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent reference ID', async () => {
    const result = await getScreenshotsByReferenceId(99999);
    expect(result).toHaveLength(0);
  });

  it('should order results by created_at desc', async () => {
    // Create a reference
    const referenceResult = await db.insert(referencesTable)
      .values({
        title: 'Test Reference',
        tags: ['ordering']
      })
      .returning()
      .execute();

    const referenceId = referenceResult[0].id;

    // Create multiple screenshots with delays to ensure different timestamps
    await db.insert(screenshotsTable)
      .values({
        ...testScreenshot,
        reference_id: referenceId
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(screenshotsTable)
      .values({
        ...testScreenshot2,
        reference_id: referenceId
      })
      .execute();

    const result = await getScreenshotsByReferenceId(referenceId);

    expect(result).toHaveLength(2);
    // Verify ordering - most recent first
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });
});

describe('getIndependentScreenshots', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return only screenshots with null reference_id', async () => {
    // Create a reference
    const referenceResult = await db.insert(referencesTable)
      .values({
        title: 'Test Reference',
        tags: ['test']
      })
      .returning()
      .execute();

    const referenceId = referenceResult[0].id;

    // Create screenshot associated with reference
    await db.insert(screenshotsTable)
      .values({
        ...testScreenshot,
        reference_id: referenceId
      })
      .execute();

    // Create independent screenshots
    await db.insert(screenshotsTable)
      .values({
        ...independentScreenshot,
        reference_id: null
      })
      .execute();

    await db.insert(screenshotsTable)
      .values({
        ...testScreenshot2,
        reference_id: null
      })
      .execute();

    const result = await getIndependentScreenshots();

    expect(result).toHaveLength(2);

    // Verify all screenshots have null reference_id
    result.forEach(screenshot => {
      expect(screenshot.reference_id).toBeNull();
      expect(screenshot.id).toBeDefined();
      expect(screenshot.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return empty array when no independent screenshots exist', async () => {
    // Create a reference and associated screenshot
    const referenceResult = await db.insert(referencesTable)
      .values({
        title: 'Test Reference',
        tags: ['test']
      })
      .returning()
      .execute();

    await db.insert(screenshotsTable)
      .values({
        ...testScreenshot,
        reference_id: referenceResult[0].id
      })
      .execute();

    const result = await getIndependentScreenshots();
    expect(result).toHaveLength(0);
  });

  it('should return empty array when no screenshots exist at all', async () => {
    const result = await getIndependentScreenshots();
    expect(result).toHaveLength(0);
  });

  it('should order results by created_at desc', async () => {
    // Create multiple independent screenshots with delays
    await db.insert(screenshotsTable)
      .values({
        ...testScreenshot,
        reference_id: null
      })
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(screenshotsTable)
      .values({
        ...independentScreenshot,
        reference_id: null
      })
      .execute();

    const result = await getIndependentScreenshots();

    expect(result).toHaveLength(2);
    // Verify ordering - most recent first
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });
});