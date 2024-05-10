import { z } from 'zod';

export const listQuery = z.object({
	filter: z
		.object({
			binding: z.union([z.string(), z.array(z.string())]).optional(),
			status: z.union([z.string(), z.array(z.string())]).optional(),
		})
		.optional(),
	sort: z
		.object({
			key: z.enum(['attempts', 'createdAt', 'startedAt', 'finishedAt', 'completedAt', 'processingTime']),
			desc: z.boolean(),
		})
		.optional(),
	page: z
		.object({
			index: z.number(),
			size: z.number(),
		})
		.optional(),
});

export type ListQuery = z.infer<typeof listQuery>;
