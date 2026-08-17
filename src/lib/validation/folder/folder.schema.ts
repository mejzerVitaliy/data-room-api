import { z } from "zod";
import {
    paginationQuerySchema,
    sortOrderSchema,
} from "@/lib/validation/pagination/pagination.schema.js";

const MAX_NAME_LENGTH = 255;
const MAX_SEARCH_LENGTH = 255;

const folderNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

const folderSortBySchema = z.enum(["name", "createdAt"]);

const folderParamsSchema = z.object({
    id: z.uuid(),
});

type FolderParams = z.infer<typeof folderParamsSchema>;

const breadcrumbSchema = z.object({
    id: z.uuid(),
    name: z.string(),
});

const folderSchema = z.object({
    id: z.uuid(),
    dataRoomId: z.uuid(),
    parentId: z.uuid().nullable(),
    name: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

const listFoldersQuerySchema = paginationQuerySchema.extend({
    dataRoomId: z.uuid(),
    parentId: z.uuid().optional(),
    search: z.string().trim().min(1).max(MAX_SEARCH_LENGTH).optional(),
    sortBy: folderSortBySchema.default("name"),
    sortOrder: sortOrderSchema.default("asc"),
});

type ListFoldersQuery = z.infer<typeof listFoldersQuerySchema>;

const createFolderBodySchema = z.object({
    dataRoomId: z.uuid(),
    parentId: z.uuid().nullable().optional(),
    name: folderNameSchema,
});

type CreateFolderInput = z.infer<typeof createFolderBodySchema>;

const updateFolderBodySchema = z
    .object({
        name: folderNameSchema.optional(),
        parentId: z.uuid().nullable().optional(),
    })
    .refine((data) => data.name !== undefined || data.parentId !== undefined, {
        message: "Provide a name and/or a parentId to update.",
    });

type UpdateFolderInput = z.infer<typeof updateFolderBodySchema>;

const folderResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        folder: folderSchema,
        breadcrumbs: z.array(breadcrumbSchema),
    }),
});

type FolderResponse = z.infer<typeof folderResponseSchema>;

const foldersListResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        page: z.number(),
        perPage: z.number(),
        total: z.number(),
        totalPages: z.number(),
        nextPage: z.number().nullable(),
        prevPage: z.number().nullable(),
        folders: z.array(folderSchema),
        breadcrumbs: z.array(breadcrumbSchema),
    }),
});

type FoldersListResponse = z.infer<typeof foldersListResponseSchema>;

export {
    folderSchema,
    folderParamsSchema,
    breadcrumbSchema,
    listFoldersQuerySchema,
    createFolderBodySchema,
    updateFolderBodySchema,
    folderResponseSchema,
    foldersListResponseSchema,
};

export type {
    FolderParams,
    ListFoldersQuery,
    CreateFolderInput,
    UpdateFolderInput,
    FolderResponse,
    FoldersListResponse,
};
