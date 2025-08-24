import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createReferenceInputSchema, 
  updateReferenceInputSchema,
  createScreenshotInputSchema,
  updateScreenshotInputSchema,
  searchReferencesInputSchema
} from './schema';

// Import handlers
import { createReference } from './handlers/create_reference';
import { getReferences } from './handlers/get_references';
import { getReferenceById } from './handlers/get_reference_by_id';
import { updateReference } from './handlers/update_reference';
import { deleteReference } from './handlers/delete_reference';
import { createScreenshot } from './handlers/create_screenshot';
import { getScreenshots, getScreenshotsByReferenceId, getIndependentScreenshots } from './handlers/get_screenshots';
import { updateScreenshot } from './handlers/update_screenshot';
import { deleteScreenshot } from './handlers/delete_screenshot';
import { searchReferences, getAllTags } from './handlers/search_references';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Reference management
  createReference: publicProcedure
    .input(createReferenceInputSchema)
    .mutation(({ input }) => createReference(input)),

  getReferences: publicProcedure
    .query(() => getReferences()),

  getReferenceById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getReferenceById(input.id)),

  updateReference: publicProcedure
    .input(updateReferenceInputSchema)
    .mutation(({ input }) => updateReference(input)),

  deleteReference: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteReference(input.id)),

  // Screenshot management
  createScreenshot: publicProcedure
    .input(createScreenshotInputSchema)
    .mutation(({ input }) => createScreenshot(input)),

  getScreenshots: publicProcedure
    .query(() => getScreenshots()),

  getScreenshotsByReferenceId: publicProcedure
    .input(z.object({ referenceId: z.number() }))
    .query(({ input }) => getScreenshotsByReferenceId(input.referenceId)),

  getIndependentScreenshots: publicProcedure
    .query(() => getIndependentScreenshots()),

  updateScreenshot: publicProcedure
    .input(updateScreenshotInputSchema)
    .mutation(({ input }) => updateScreenshot(input)),

  deleteScreenshot: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteScreenshot(input.id)),

  // Search and organization
  searchReferences: publicProcedure
    .input(searchReferencesInputSchema)
    .query(({ input }) => searchReferences(input)),

  getAllTags: publicProcedure
    .query(() => getAllTags()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();