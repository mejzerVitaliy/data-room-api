import { z } from "zod";

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
    perPage: z.coerce
        .number()
        .int()
        .positive()
        .max(MAX_PER_PAGE)
        .default(DEFAULT_PER_PAGE),
});

type PaginationQuery = z.infer<typeof paginationQuerySchema>;

const paginationMetaSchema = z.object({
    page: z.number(),
    perPage: z.number(),
    total: z.number(),
    totalPages: z.number(),
    nextPage: z.number().nullable(),
    prevPage: z.number().nullable(),
});

const sortOrderSchema = z.enum(["asc", "desc"]);

export { paginationQuerySchema, paginationMetaSchema, sortOrderSchema };
export type { PaginationQuery };
