import { FastifyInstance } from "fastify";
import { FolderHandler } from "./folder.handler.js";
import {
    messageResponseSchema,
    deletePreviewResponseSchema,
} from "@/lib/validation/common/common.schema.js";
import {
    folderParamsSchema,
    listFoldersQuerySchema,
    createFolderBodySchema,
    updateFolderBodySchema,
    folderResponseSchema,
    foldersListResponseSchema,
} from "@/lib/validation/folder/folder.schema.js";

const FOLDER_TAG = "folder";

enum FolderRoute {
    Root = "/",
    ById = "/:id",
    DeletePreview = "/:id/delete-preview",
}

export const createFolderRoutes = (
    fastify: FastifyInstance,
    folderHandler: FolderHandler
) => {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.get(
        FolderRoute.Root,
        {
            schema: {
                tags: [FOLDER_TAG],
                summary: "List folders at a given level (root or a parent)",
                querystring: listFoldersQuerySchema,
                response: { 200: foldersListResponseSchema },
            },
        },
        folderHandler.list
    );

    fastify.post(
        FolderRoute.Root,
        {
            schema: {
                tags: [FOLDER_TAG],
                summary: "Create a folder",
                body: createFolderBodySchema,
                response: { 200: folderResponseSchema },
            },
        },
        folderHandler.create
    );

    fastify.get(
        FolderRoute.ById,
        {
            schema: {
                tags: [FOLDER_TAG],
                summary: "Get a folder with its breadcrumb trail",
                params: folderParamsSchema,
                response: { 200: folderResponseSchema },
            },
        },
        folderHandler.getOne
    );

    fastify.patch(
        FolderRoute.ById,
        {
            schema: {
                tags: [FOLDER_TAG],
                summary: "Rename and/or move a folder",
                params: folderParamsSchema,
                body: updateFolderBodySchema,
                response: { 200: folderResponseSchema },
            },
        },
        folderHandler.update
    );

    fastify.delete(
        FolderRoute.ById,
        {
            schema: {
                tags: [FOLDER_TAG],
                summary: "Delete a folder and everything nested in it",
                params: folderParamsSchema,
                response: { 200: messageResponseSchema },
            },
        },
        folderHandler.remove
    );

    fastify.get(
        FolderRoute.DeletePreview,
        {
            schema: {
                tags: [FOLDER_TAG],
                summary: "Preview what deleting a folder will remove",
                params: folderParamsSchema,
                response: { 200: deletePreviewResponseSchema },
            },
        },
        folderHandler.getDeletePreview
    );
};
