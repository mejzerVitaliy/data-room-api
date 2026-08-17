import { z } from "zod";
import { breadcrumbSchema } from "@/lib/validation/folder/folder.schema.js";
import {
    paginationQuerySchema,
    sortOrderSchema,
} from "@/lib/validation/pagination/pagination.schema.js";

const MAX_NAME_LENGTH = 255;
const MAX_SEARCH_LENGTH = 255;
const BYTES_PER_MB = 1024 * 1024;
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * BYTES_PER_MB;

const fileNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

const fileSortBySchema = z.enum(["name", "createdAt"]);

// Deliberately excludes text/html, image/svg+xml and any script-executable
// type: uploaded files are later rendered via an <iframe src="viewUrl">, so an
// unrestricted content type would let a browser execute uploaded HTML/SVG as
// if it were a first-class document.
const ALLOWED_UPLOAD_MIME_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/rtf",
    "application/zip",
    "application/octet-stream",
] as const;

const UNSUPPORTED_MIME_TYPE_MESSAGE =
    "This file type isn't supported. Try PDF, Word, Excel, PowerPoint, an image, or a plain text file.";

const uploadMimeTypeSchema = z.enum(
    ALLOWED_UPLOAD_MIME_TYPES,
    UNSUPPORTED_MIME_TYPE_MESSAGE
);

const fileTypeFilterSchema = z.enum([
    "pdf",
    "image",
    "document",
    "spreadsheet",
    "other",
]);

type FileTypeFilter = z.infer<typeof fileTypeFilterSchema>;

const fileParamsSchema = z.object({
    id: z.uuid(),
});

type FileParams = z.infer<typeof fileParamsSchema>;

const fileSchema = z.object({
    id: z.uuid(),
    dataRoomId: z.uuid(),
    folderId: z.uuid().nullable(),
    name: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number(),
    uploadedById: z.uuid(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

const createUploadUrlBodySchema = z.object({
    dataRoomId: z.uuid(),
    folderId: z.uuid().nullable().optional(),
    name: fileNameSchema,
    mimeType: uploadMimeTypeSchema,
    sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
});

type CreateUploadUrlInput = z.infer<typeof createUploadUrlBodySchema>;

const createUploadUrlResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        uploadUrl: z.string(),
        storageKey: z.string(),
    }),
});

type CreateUploadUrlResponse = z.infer<typeof createUploadUrlResponseSchema>;

const completeUploadBodySchema = z.object({
    dataRoomId: z.uuid(),
    folderId: z.uuid().nullable().optional(),
    name: fileNameSchema,
    mimeType: uploadMimeTypeSchema,
    sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
    storageKey: z.string().min(1),
});

type CompleteUploadInput = z.infer<typeof completeUploadBodySchema>;

const updateFileBodySchema = z
    .object({
        name: fileNameSchema.optional(),
        folderId: z.uuid().nullable().optional(),
    })
    .refine((data) => data.name !== undefined || data.folderId !== undefined, {
        message: "Provide a name and/or a folderId to update.",
    });

type UpdateFileInput = z.infer<typeof updateFileBodySchema>;

const listFilesQuerySchema = paginationQuerySchema.extend({
    dataRoomId: z.uuid(),
    folderId: z.uuid().optional(),
    search: z.string().trim().min(1).max(MAX_SEARCH_LENGTH).optional(),
    sortBy: fileSortBySchema.default("name"),
    sortOrder: sortOrderSchema.default("asc"),
    fileType: fileTypeFilterSchema.optional(),
});

type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;

const fileResponseSchema = z.object({
    message: z.string(),
    data: z.object({ file: fileSchema }),
});

type FileResponse = z.infer<typeof fileResponseSchema>;

const fileWithViewUrlResponseSchema = z.object({
    message: z.string(),
    data: z.object({ file: fileSchema, viewUrl: z.string() }),
});

type FileWithViewUrlResponse = z.infer<typeof fileWithViewUrlResponseSchema>;

const filesListResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        page: z.number(),
        perPage: z.number(),
        total: z.number(),
        totalPages: z.number(),
        nextPage: z.number().nullable(),
        prevPage: z.number().nullable(),
        files: z.array(fileSchema),
        breadcrumbs: z.array(breadcrumbSchema),
    }),
});

type FilesListResponse = z.infer<typeof filesListResponseSchema>;

export {
    fileSchema,
    fileParamsSchema,
    createUploadUrlBodySchema,
    createUploadUrlResponseSchema,
    completeUploadBodySchema,
    updateFileBodySchema,
    listFilesQuerySchema,
    fileResponseSchema,
    fileWithViewUrlResponseSchema,
    filesListResponseSchema,
};

export type {
    FileParams,
    CreateUploadUrlInput,
    CreateUploadUrlResponse,
    CompleteUploadInput,
    UpdateFileInput,
    ListFilesQuery,
    FileResponse,
    FileWithViewUrlResponse,
    FilesListResponse,
    FileTypeFilter,
};
