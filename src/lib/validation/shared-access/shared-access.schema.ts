import { z } from "zod";
import { fileSchema } from "@/lib/validation/file/file.schema.js";
import { shareResourceTypeSchema } from "@/lib/validation/share/share.schema.js";
import { paginationQuerySchema } from "@/lib/validation/pagination/pagination.schema.js";
import {
    folderSchema,
    breadcrumbSchema,
} from "@/lib/validation/folder/folder.schema.js";

const sharedTokenParamsSchema = z.object({
    token: z.string().min(1),
});

const sharedFolderParamsSchema = z.object({
    id: z.uuid(),
});

const sharedTokenResourceParamsSchema = z.object({
    token: z.string().min(1),
    id: z.uuid(),
});

type SharedFolderParams = z.infer<typeof sharedFolderParamsSchema>;
type SharedTokenParams = z.infer<typeof sharedTokenParamsSchema>;
type SharedTokenResourceParams = z.infer<
    typeof sharedTokenResourceParamsSchema
>;

const sharedContentsResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        resourceType: shareResourceTypeSchema,
        dataRoomName: z.string(),
        folder: folderSchema.nullable(),
        breadcrumbs: z.array(breadcrumbSchema),
        page: z.number(),
        perPage: z.number(),
        total: z.number(),
        totalPages: z.number(),
        nextPage: z.number().nullable(),
        prevPage: z.number().nullable(),
        folders: z.array(folderSchema),
        files: z.array(fileSchema),
    }),
});

type SharedContentsResponse = z.infer<typeof sharedContentsResponseSchema>;

const sharedFileResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        resourceType: shareResourceTypeSchema,
        dataRoomName: z.string(),
        file: fileSchema,
        viewUrl: z.string(),
    }),
});

type SharedFileResponse = z.infer<typeof sharedFileResponseSchema>;

const sharedEntryResponseSchema = z.union([
    sharedContentsResponseSchema,
    sharedFileResponseSchema,
]);

const sharedWithMeItemSchema = z.object({
    shareId: z.uuid(),
    resourceType: shareResourceTypeSchema,
    resourceId: z.uuid(),
    name: z.string(),
    dataRoomName: z.string(),
    sharedAt: z.date(),
});

const sharedWithMeListResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        page: z.number(),
        perPage: z.number(),
        total: z.number(),
        totalPages: z.number(),
        nextPage: z.number().nullable(),
        prevPage: z.number().nullable(),
        shares: z.array(sharedWithMeItemSchema),
    }),
});

type SharedWithMeListResponse = z.infer<typeof sharedWithMeListResponseSchema>;

export {
    sharedTokenParamsSchema,
    sharedFolderParamsSchema,
    sharedTokenResourceParamsSchema,
    sharedContentsResponseSchema,
    sharedFileResponseSchema,
    sharedEntryResponseSchema,
    sharedWithMeListResponseSchema,
    paginationQuerySchema as sharedListQuerySchema,
};

export type {
    SharedFolderParams,
    SharedTokenParams,
    SharedTokenResourceParams,
    SharedContentsResponse,
    SharedFileResponse,
    SharedWithMeListResponse,
};
