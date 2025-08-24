import { z } from 'zod';

// Reference schema - main entity for UI references
export const referenceSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string().url().nullable(), // Can be null for references without URLs
  description: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()), // Array of tags for organization
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Reference = z.infer<typeof referenceSchema>;

// Screenshot schema - associated with references
export const screenshotSchema = z.object({
  id: z.number(),
  reference_id: z.number().nullable(), // Can exist independently of references
  filename: z.string(),
  original_filename: z.string(),
  file_path: z.string(),
  file_size: z.number().int(),
  mime_type: z.string(),
  alt_text: z.string().nullable(), // Alt text for accessibility
  created_at: z.coerce.date()
});

export type Screenshot = z.infer<typeof screenshotSchema>;

// Input schema for creating references
export const createReferenceInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url().nullable().optional(), // Optional URL
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]) // Default to empty array
});

export type CreateReferenceInput = z.infer<typeof createReferenceInputSchema>;

// Input schema for updating references
export const updateReferenceInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  url: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

export type UpdateReferenceInput = z.infer<typeof updateReferenceInputSchema>;

// Input schema for creating screenshots
export const createScreenshotInputSchema = z.object({
  reference_id: z.number().nullable().optional(), // Optional reference association
  filename: z.string().min(1),
  original_filename: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().int().positive(),
  mime_type: z.string().min(1),
  alt_text: z.string().nullable().optional()
});

export type CreateScreenshotInput = z.infer<typeof createScreenshotInputSchema>;

// Input schema for updating screenshots
export const updateScreenshotInputSchema = z.object({
  id: z.number(),
  reference_id: z.number().nullable().optional(),
  alt_text: z.string().nullable().optional()
});

export type UpdateScreenshotInput = z.infer<typeof updateScreenshotInputSchema>;

// Search input schema
export const searchReferencesInputSchema = z.object({
  query: z.string().optional(), // Text search in title, description, notes
  tags: z.array(z.string()).optional(), // Filter by tags
  has_url: z.boolean().optional(), // Filter references with/without URLs
  has_screenshots: z.boolean().optional() // Filter references with/without screenshots
});

export type SearchReferencesInput = z.infer<typeof searchReferencesInputSchema>;

// Reference with screenshots schema for detailed views
export const referenceWithScreenshotsSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string().url().nullable(),
  description: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  screenshots: z.array(screenshotSchema)
});

export type ReferenceWithScreenshots = z.infer<typeof referenceWithScreenshotsSchema>;