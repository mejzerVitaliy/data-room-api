import { FileService } from "./file.service.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import {
    FileParams,
    ListFilesQuery,
    UpdateFileInput,
    CompleteUploadInput,
    CreateUploadUrlInput,
} from "@/lib/validation/file/file.schema.js";

export type FileHandler = {
    createUploadUrl: (
        request: FastifyRequest<{ Body: CreateUploadUrlInput }>,
        reply: FastifyReply
    ) => Promise<void>;

    completeUpload: (
        request: FastifyRequest<{ Body: CompleteUploadInput }>,
        reply: FastifyReply
    ) => Promise<void>;

    list: (
        request: FastifyRequest<{ Querystring: ListFilesQuery }>,
        reply: FastifyReply
    ) => Promise<void>;

    getOne: (
        request: FastifyRequest<{ Params: FileParams }>,
        reply: FastifyReply
    ) => Promise<void>;

    update: (
        request: FastifyRequest<{
            Params: FileParams;
            Body: UpdateFileInput;
        }>,
        reply: FastifyReply
    ) => Promise<void>;

    remove: (
        request: FastifyRequest<{ Params: FileParams }>,
        reply: FastifyReply
    ) => Promise<void>;
};

export const createHandler = (fileService: FileService): FileHandler => {
    return {
        createUploadUrl: async (request, reply) => {
            const data = await fileService.createUploadUrl({
                userId: request.user.id,
                payload: request.body,
            });

            return reply.send(data);
        },

        completeUpload: async (request, reply) => {
            const data = await fileService.completeUpload({
                userId: request.user.id,
                payload: request.body,
            });

            return reply.send(data);
        },

        list: async (request, reply) => {
            const data = await fileService.list({
                userId: request.user.id,
                query: request.query,
            });

            return reply.send(data);
        },

        getOne: async (request, reply) => {
            const data = await fileService.getOne({
                userId: request.user.id,
                fileId: request.params.id,
            });

            return reply.send(data);
        },

        update: async (request, reply) => {
            const data = await fileService.update({
                userId: request.user.id,
                fileId: request.params.id,
                payload: request.body,
            });

            return reply.send(data);
        },

        remove: async (request, reply) => {
            const data = await fileService.remove({
                userId: request.user.id,
                fileId: request.params.id,
            });

            return reply.send(data);
        },
    };
};

addDIResolverName(createHandler, "fileHandler");
