import { FastifyReply, FastifyRequest } from "fastify";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { SharedAccessService } from "./shared-access.service.js";
import { PaginationQuery } from "@/lib/validation/pagination/pagination.schema.js";
import {
    SharedFolderParams,
    SharedTokenParams,
    SharedTokenResourceParams,
} from "@/lib/validation/shared-access/shared-access.schema.js";

export type SharedAccessHandler = {
    resolvePublicEntry: (
        request: FastifyRequest<{
            Params: SharedTokenParams;
            Querystring: PaginationQuery;
        }>,
        reply: FastifyReply
    ) => Promise<void>;

    browsePublicFolder: (
        request: FastifyRequest<{
            Params: SharedTokenResourceParams;
            Querystring: PaginationQuery;
        }>,
        reply: FastifyReply
    ) => Promise<void>;

    viewPublicFile: (
        request: FastifyRequest<{ Params: SharedTokenResourceParams }>,
        reply: FastifyReply
    ) => Promise<void>;

    listMyShares: (
        request: FastifyRequest<{ Querystring: PaginationQuery }>,
        reply: FastifyReply
    ) => Promise<void>;

    resolvePermissionedDataRoom: (
        request: FastifyRequest<{
            Params: SharedFolderParams;
            Querystring: PaginationQuery;
        }>,
        reply: FastifyReply
    ) => Promise<void>;

    browsePermissionedFolder: (
        request: FastifyRequest<{
            Params: SharedFolderParams;
            Querystring: PaginationQuery;
        }>,
        reply: FastifyReply
    ) => Promise<void>;

    viewPermissionedFile: (
        request: FastifyRequest<{ Params: SharedFolderParams }>,
        reply: FastifyReply
    ) => Promise<void>;
};

export const createHandler = (
    sharedAccessService: SharedAccessService
): SharedAccessHandler => {
    return {
        resolvePublicEntry: async (request, reply) => {
            const data = await sharedAccessService.resolvePublicEntry({
                token: request.params.token,
                query: request.query,
            });

            return reply.send(data);
        },

        browsePublicFolder: async (request, reply) => {
            const data = await sharedAccessService.browsePublicFolder({
                token: request.params.token,
                folderId: request.params.id,
                query: request.query,
            });

            return reply.send(data);
        },

        viewPublicFile: async (request, reply) => {
            const data = await sharedAccessService.viewPublicFile({
                token: request.params.token,
                fileId: request.params.id,
            });

            return reply.send(data);
        },

        listMyShares: async (request, reply) => {
            const data = await sharedAccessService.listMyShares({
                userId: request.user.id,
                userEmail: request.user.email,
                query: request.query,
            });

            return reply.send(data);
        },

        resolvePermissionedDataRoom: async (request, reply) => {
            const data = await sharedAccessService.resolvePermissionedDataRoom({
                userId: request.user.id,
                userEmail: request.user.email,
                dataRoomId: request.params.id,
                query: request.query,
            });

            return reply.send(data);
        },

        browsePermissionedFolder: async (request, reply) => {
            const data = await sharedAccessService.browsePermissionedFolder({
                userId: request.user.id,
                userEmail: request.user.email,
                folderId: request.params.id,
                query: request.query,
            });

            return reply.send(data);
        },

        viewPermissionedFile: async (request, reply) => {
            const data = await sharedAccessService.viewPermissionedFile({
                userId: request.user.id,
                userEmail: request.user.email,
                fileId: request.params.id,
            });

            return reply.send(data);
        },
    };
};

addDIResolverName(createHandler, "sharedAccessHandler");
