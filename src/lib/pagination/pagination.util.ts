import { PaginationQuery } from "@/lib/validation/pagination/pagination.schema.js";

export type PaginationMeta = {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
};

export const getPaginationSkipTake = (
    query: PaginationQuery
): { skip: number; take: number } => {
    const { page, perPage } = query;

    return { skip: (page - 1) * perPage, take: perPage };
};

export const buildPaginationMeta = (params: {
    page: number;
    perPage: number;
    total: number;
}): PaginationMeta => {
    const { page, perPage, total } = params;
    const totalPages = Math.max(Math.ceil(total / perPage), 1);

    return {
        page,
        perPage,
        total,
        totalPages,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
    };
};
