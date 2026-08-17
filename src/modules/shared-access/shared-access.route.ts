import { FastifyInstance } from "fastify";
import { SharedAccessHandler } from "./shared-access.handler.js";
import { paginationQuerySchema } from "@/lib/validation/pagination/pagination.schema.js";
import {
    sharedTokenParamsSchema,
    sharedFolderParamsSchema,
    sharedEntryResponseSchema,
    sharedFileResponseSchema,
    sharedContentsResponseSchema,
    sharedTokenResourceParamsSchema,
    sharedWithMeListResponseSchema,
} from "@/lib/validation/shared-access/shared-access.schema.js";

const SHARED_ACCESS_TAG = "shared-access";

enum SharedAccessRoute {
    PublicEntry = "/public/:token",
    PublicFolder = "/public/:token/folders/:id",
    PublicFile = "/public/:token/files/:id",
    WithMe = "/with-me",
    WithMeDataRoom = "/with-me/data-rooms/:id",
    WithMeFolder = "/with-me/folders/:id",
    WithMeFile = "/with-me/files/:id",
}

export const createSharedAccessRoutes = (
    fastify: FastifyInstance,
    sharedAccessHandler: SharedAccessHandler
) => {
    fastify.get(
        SharedAccessRoute.PublicEntry,
        {
            schema: {
                tags: [SHARED_ACCESS_TAG],
                summary: "Resolve a public share link",
                params: sharedTokenParamsSchema,
                querystring: paginationQuerySchema,
                response: { 200: sharedEntryResponseSchema },
            },
        },
        sharedAccessHandler.resolvePublicEntry
    );

    fastify.get(
        SharedAccessRoute.PublicFolder,
        {
            schema: {
                tags: [SHARED_ACCESS_TAG],
                summary: "Browse a folder within a public share",
                params: sharedTokenResourceParamsSchema,
                querystring: paginationQuerySchema,
                response: { 200: sharedContentsResponseSchema },
            },
        },
        sharedAccessHandler.browsePublicFolder
    );

    fastify.get(
        SharedAccessRoute.PublicFile,
        {
            schema: {
                tags: [SHARED_ACCESS_TAG],
                summary: "View a file within a public share",
                params: sharedTokenResourceParamsSchema,
                response: { 200: sharedFileResponseSchema },
            },
        },
        sharedAccessHandler.viewPublicFile
    );

    fastify.register(async (scoped) => {
        scoped.addHook("preHandler", fastify.authenticate);

        scoped.get(
            SharedAccessRoute.WithMe,
            {
                schema: {
                    tags: [SHARED_ACCESS_TAG],
                    summary: "List everything shared with me",
                    querystring: paginationQuerySchema,
                    response: { 200: sharedWithMeListResponseSchema },
                },
            },
            sharedAccessHandler.listMyShares
        );

        scoped.get(
            SharedAccessRoute.WithMeDataRoom,
            {
                schema: {
                    tags: [SHARED_ACCESS_TAG],
                    summary: "Browse a Data Room shared with me",
                    params: sharedFolderParamsSchema,
                    querystring: paginationQuerySchema,
                    response: { 200: sharedContentsResponseSchema },
                },
            },
            sharedAccessHandler.resolvePermissionedDataRoom
        );

        scoped.get(
            SharedAccessRoute.WithMeFolder,
            {
                schema: {
                    tags: [SHARED_ACCESS_TAG],
                    summary: "Browse a folder shared with me",
                    params: sharedFolderParamsSchema,
                    querystring: paginationQuerySchema,
                    response: { 200: sharedContentsResponseSchema },
                },
            },
            sharedAccessHandler.browsePermissionedFolder
        );

        scoped.get(
            SharedAccessRoute.WithMeFile,
            {
                schema: {
                    tags: [SHARED_ACCESS_TAG],
                    summary: "View a file shared with me",
                    params: sharedFolderParamsSchema,
                    response: { 200: sharedFileResponseSchema },
                },
            },
            sharedAccessHandler.viewPermissionedFile
        );
    });
};
