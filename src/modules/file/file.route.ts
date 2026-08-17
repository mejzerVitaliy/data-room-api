import { FastifyInstance } from "fastify";
import { FileHandler } from "./file.handler.js";
import { messageResponseSchema } from "@/lib/validation/common/common.schema.js";
import {
    fileParamsSchema,
    listFilesQuerySchema,
    updateFileBodySchema,
    fileResponseSchema,
    completeUploadBodySchema,
    filesListResponseSchema,
    createUploadUrlBodySchema,
    createUploadUrlResponseSchema,
    fileWithViewUrlResponseSchema,
} from "@/lib/validation/file/file.schema.js";

const FILE_TAG = "file";

enum FileRoute {
    Root = "/",
    UploadUrl = "/upload-url",
    ById = "/:id",
}

export const createFileRoutes = (
    fastify: FastifyInstance,
    fileHandler: FileHandler
) => {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.post(
        FileRoute.UploadUrl,
        {
            schema: {
                tags: [FILE_TAG],
                summary: "Create a presigned upload URL for a new file",
                body: createUploadUrlBodySchema,
                response: { 200: createUploadUrlResponseSchema },
            },
        },
        fileHandler.createUploadUrl
    );

    fastify.post(
        FileRoute.Root,
        {
            schema: {
                tags: [FILE_TAG],
                summary: "Finalize an uploaded file",
                body: completeUploadBodySchema,
                response: { 200: fileResponseSchema },
            },
        },
        fileHandler.completeUpload
    );

    fastify.get(
        FileRoute.Root,
        {
            schema: {
                tags: [FILE_TAG],
                summary: "List files at a given level (root or a folder)",
                querystring: listFilesQuerySchema,
                response: { 200: filesListResponseSchema },
            },
        },
        fileHandler.list
    );

    fastify.get(
        FileRoute.ById,
        {
            schema: {
                tags: [FILE_TAG],
                summary: "Get a file with a signed URL to view it",
                params: fileParamsSchema,
                response: { 200: fileWithViewUrlResponseSchema },
            },
        },
        fileHandler.getOne
    );

    fastify.patch(
        FileRoute.ById,
        {
            schema: {
                tags: [FILE_TAG],
                summary: "Rename and/or move a file",
                params: fileParamsSchema,
                body: updateFileBodySchema,
                response: { 200: fileResponseSchema },
            },
        },
        fileHandler.update
    );

    fastify.delete(
        FileRoute.ById,
        {
            schema: {
                tags: [FILE_TAG],
                summary: "Delete a file",
                params: fileParamsSchema,
                response: { 200: messageResponseSchema },
            },
        },
        fileHandler.remove
    );
};
