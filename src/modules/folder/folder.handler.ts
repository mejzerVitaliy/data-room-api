import { FolderService } from "./folder.service.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import {
    FolderParams,
    ListFoldersQuery,
    CreateFolderInput,
    UpdateFolderInput,
} from "@/lib/validation/folder/folder.schema.js";

export type FolderHandler = {
    list: (
        request: FastifyRequest<{ Querystring: ListFoldersQuery }>,
        reply: FastifyReply
    ) => Promise<void>;

    create: (
        request: FastifyRequest<{ Body: CreateFolderInput }>,
        reply: FastifyReply
    ) => Promise<void>;

    getOne: (
        request: FastifyRequest<{ Params: FolderParams }>,
        reply: FastifyReply
    ) => Promise<void>;

    update: (
        request: FastifyRequest<{
            Params: FolderParams;
            Body: UpdateFolderInput;
        }>,
        reply: FastifyReply
    ) => Promise<void>;

    remove: (
        request: FastifyRequest<{ Params: FolderParams }>,
        reply: FastifyReply
    ) => Promise<void>;

    getDeletePreview: (
        request: FastifyRequest<{ Params: FolderParams }>,
        reply: FastifyReply
    ) => Promise<void>;
};

export const createHandler = (folderService: FolderService): FolderHandler => {
    return {
        list: async (request, reply) => {
            const data = await folderService.list({
                userId: request.user.id,
                query: request.query,
            });

            return reply.send(data);
        },

        create: async (request, reply) => {
            const data = await folderService.create({
                userId: request.user.id,
                payload: request.body,
            });

            return reply.send(data);
        },

        getOne: async (request, reply) => {
            const data = await folderService.getOne({
                userId: request.user.id,
                folderId: request.params.id,
            });

            return reply.send(data);
        },

        update: async (request, reply) => {
            const data = await folderService.update({
                userId: request.user.id,
                folderId: request.params.id,
                payload: request.body,
            });

            return reply.send(data);
        },

        remove: async (request, reply) => {
            const data = await folderService.remove({
                userId: request.user.id,
                folderId: request.params.id,
            });

            return reply.send(data);
        },

        getDeletePreview: async (request, reply) => {
            const data = await folderService.getDeletePreview({
                userId: request.user.id,
                folderId: request.params.id,
            });

            return reply.send(data);
        },
    };
};

addDIResolverName(createHandler, "folderHandler");
