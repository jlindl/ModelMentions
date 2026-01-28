import { z } from 'zod';

export const StartScanSchema = z.object({
    includeCompetitors: z.boolean().optional().default(false),
});

export const ProcessBatchSchema = z.object({
    runId: z.string().uuid("Invalid Run ID format"),
    batchSize: z.number().int().min(1).max(10).optional().default(3),
});
